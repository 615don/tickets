import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

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

    // Execute pg_dump command
    const dumpFile = path.join(tempDir, 'database.sql');
    const pgDumpCommand = `pg_dump -h ${dbHost} -U ${dbUser} -d ${dbName} > ${dumpFile}`;

    try {
      await execAsync(pgDumpCommand, {
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
