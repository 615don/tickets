import { execFile } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

const execFileAsync = promisify(execFile);

/**
 * POST /api/backup/generate
 * Generate and download a complete database backup with environment configuration
 */
export async function generateBackup(req, res) {
  const timestamp = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-').substring(0, 17);
  const tempDir = `/tmp/backup-${timestamp}`;
  const zipFilename = `backup-${timestamp}.zip`;

  try {
    // Create temporary directory
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Extract database credentials from environment
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbName = process.env.DB_NAME || 'ticketing_system';
    const dbPassword = process.env.DB_PASSWORD || '';

    // Execute pg_dump command using execFile for security (prevents shell injection)
    const dumpFile = path.join(tempDir, 'database.sql');

    try {
      // Use execFile with array arguments to prevent shell injection
      const { stdout, stderr } = await execFileAsync('pg_dump', [
        '-h', dbHost,
        '-U', dbUser,
        '-d', dbName,
        '-f', dumpFile  // Output to file directly instead of shell redirection
      ], {
        env: { ...process.env, PGPASSWORD: dbPassword },
        timeout: 300000, // 5 minutes
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer for large databases
      });
    } catch (pgDumpError) {
      // Clean up temp directory
      await fs.promises.rm(tempDir, { recursive: true, force: true });

      // Handle specific pg_dump errors
      if (pgDumpError.message.includes('command not found') || pgDumpError.message.includes('not found')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Database backup tool not available on this server. Please contact support.'
        });
      }

      if (pgDumpError.message.includes('timeout')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Backup generation timed out. Please try again or contact support.'
        });
      }

      if (pgDumpError.message.includes('connection') || pgDumpError.message.includes('could not connect')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Failed to connect to database. Please try again later.'
        });
      }

      if (pgDumpError.message.includes('password authentication failed') || pgDumpError.message.includes('authentication')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Database authentication failed. Please contact support.'
        });
      }

      // Generic pg_dump error
      console.error('pg_dump error:', pgDumpError);
      return res.status(500).json({
        error: 'ServerError',
        message: 'Failed to generate database backup. Please try again.'
      });
    }

    // Create sanitized environment configuration
    const sanitizedConfig = {
      XERO_CLIENT_ID: process.env.XERO_CLIENT_ID || '',
      XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET || '',
      XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI || '',
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
      SESSION_SECRET: process.env.SESSION_SECRET || ''
    };

    // Write sanitized config to file
    const configFile = path.join(tempDir, 'environment-config.json');
    await fs.promises.writeFile(configFile, JSON.stringify(sanitizedConfig, null, 2));

    // Create ZIP archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

    // Handle archiver errors
    archive.on('error', async (err) => {
      console.error('Archiver error:', err);

      // Clean up temp directory
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to clean up temp directory:', cleanupError);
      }

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Failed to create backup archive. Please try again.'
        });
      }
    });

    // Clean up temp directory after streaming completes
    archive.on('end', async () => {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Failed to clean up temp directory:', cleanupError);
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    archive.file(dumpFile, { name: 'database.sql' });
    archive.file(configFile, { name: 'environment-config.json' });

    // Finalize the archive
    await archive.finalize();

  } catch (error) {
    console.error('Error generating backup:', error);

    // Clean up temp directory
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to clean up temp directory:', cleanupError);
    }

    // Handle file system errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Permission denied while creating backup. Please contact support.'
      });
    }

    if (error.code === 'ENOSPC') {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Insufficient disk space to create backup. Please contact support.'
      });
    }

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Failed to generate backup. Please try again.'
      });
    }
  }
}

/**
 * POST /api/backup/restore
 * Restore database from backup ZIP file
 */
export async function restoreBackup(req, res) {
  // Check if file was uploaded
  if (!req.file) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'No backup file provided. Please upload a ZIP backup file.'
    });
  }

  const timestamp = Date.now();
  const extractDir = `/tmp/restore-${timestamp}`;
  const uploadedFile = req.file.path;

  try {
    // Check file size (multer should handle this, but double-check)
    const fileStats = await fs.promises.stat(uploadedFile);
    if (fileStats.size > 100 * 1024 * 1024) {
      await fs.promises.unlink(uploadedFile);
      return res.status(413).json({
        error: 'PayloadTooLarge',
        message: 'Backup file too large. Maximum size is 100MB.'
      });
    }

    // Extract ZIP file
    let zip;
    try {
      zip = new AdmZip(uploadedFile);
    } catch (zipError) {
      await fs.promises.unlink(uploadedFile);
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid ZIP file. Please upload a valid backup file.'
      });
    }

    // Create extraction directory
    await fs.promises.mkdir(extractDir, { recursive: true });

    // Extract all files
    try {
      zip.extractAllTo(extractDir, true);
    } catch (extractError) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Failed to extract backup file. Please verify the file is not corrupted.'
      });
    }

    // Validate ZIP structure - check for required files
    const databaseSqlPath = path.join(extractDir, 'database.sql');
    const environmentConfigPath = path.join(extractDir, 'environment-config.json');

    const databaseSqlExists = await fs.promises.access(databaseSqlPath).then(() => true).catch(() => false);
    const environmentConfigExists = await fs.promises.access(environmentConfigPath).then(() => true).catch(() => false);

    if (!databaseSqlExists || !environmentConfigExists) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Invalid backup file. Expected database.sql and environment-config.json'
      });
    }

    // Read and validate environment config JSON
    let environmentConfig;
    try {
      const configContent = await fs.promises.readFile(environmentConfigPath, 'utf-8');
      environmentConfig = JSON.parse(configContent);
    } catch (jsonError) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Backup file contains invalid environment configuration'
      });
    }

    // Execute database restore using psql (with execFile for security - prevents shell injection)
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbName = process.env.DB_NAME || 'ticketing_system';
    const dbPassword = process.env.DB_PASSWORD || '';

    try {
      // Use execFile with array arguments to prevent shell injection
      await execFileAsync('psql', [
        '-h', dbHost,
        '-U', dbUser,
        '-d', dbName,
        '-f', databaseSqlPath
      ], {
        env: { ...process.env, PGPASSWORD: dbPassword },
        timeout: 300000, // 5 minutes
        maxBuffer: 50 * 1024 * 1024 // 50MB buffer
      });
    } catch (psqlError) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);

      // Handle specific psql errors
      if (psqlError.message.includes('command not found') || psqlError.message.includes('not found')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Database restore failed. psql command not available.'
        });
      }

      if (psqlError.message.includes('timeout')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Database restore timed out. Please try again with a smaller backup.'
        });
      }

      if (psqlError.message.includes('connection') || psqlError.message.includes('could not connect')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Unable to connect to database. Please verify database is running.'
        });
      }

      if (psqlError.message.includes('syntax error') || psqlError.message.includes('ERROR:')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Backup file contains invalid SQL. Please verify backup integrity.'
        });
      }

      // Generic psql error
      console.error('psql error:', psqlError);
      return res.status(500).json({
        error: 'ServerError',
        message: 'Database restore failed. Please try again or contact support.'
      });
    }

    // Invalidate all active sessions after successful restore
    try {
      await pool.query('TRUNCATE TABLE session');
    } catch (sessionError) {
      console.error('Failed to invalidate sessions:', sessionError);
      // Continue even if session invalidation fails - restore was successful
    }

    // Clean up temporary files
    await fs.promises.rm(extractDir, { recursive: true, force: true });
    await fs.promises.unlink(uploadedFile);

    // Return success response with environment config
    return res.status(200).json({
      message: 'Database restored successfully. All users have been logged out. Please update your .env file with the configuration provided.',
      environmentConfig
    });

  } catch (error) {
    console.error('Error restoring backup:', error);

    // Clean up temporary files
    try {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Failed to clean up extraction directory:', cleanupError);
    }

    try {
      await fs.promises.unlink(uploadedFile);
    } catch (cleanupError) {
      console.error('Failed to clean up uploaded file:', cleanupError);
    }

    // Handle file system errors
    if (error.code === 'EACCES' || error.code === 'EPERM') {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Permission denied while restoring backup. Please contact support.'
      });
    }

    if (error.code === 'ENOSPC') {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Insufficient disk space to restore backup. Please contact support.'
      });
    }

    if (!res.headersSent) {
      return res.status(500).json({
        error: 'ServerError',
        message: 'Failed to restore backup. Please try again.'
      });
    }
  }
}
