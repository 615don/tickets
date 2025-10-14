import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import { createBackupZip } from '../services/databaseBackupService.js';
import { uploadBackup, isAuthenticated, getAuthUrl, exchangeCodeForTokens, listBackups, deleteOldBackups } from '../services/googleDriveService.js';
import { triggerManualBackup, restartScheduler } from '../services/backupScheduler.js';

/**
 * POST /api/backup/generate
 * Generate and download a complete database backup with environment configuration
 * Now uses programmatic backup (no pg_dump required)
 */
export async function generateBackup(req, res) {
  const timestamp = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-').substring(0, 17);
  const zipFilename = `backup-${timestamp}.zip`;
  const tempBackupPath = `/tmp/${zipFilename}`;

  try {
    // Create backup ZIP using new programmatic method
    await createBackupZip(tempBackupPath);

    // Stream file to response
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=${zipFilename}`);

    const fileStream = fs.createReadStream(tempBackupPath);

    fileStream.on('end', async () => {
      // Clean up temp file
      try {
        await fs.promises.unlink(tempBackupPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    });

    fileStream.on('error', async (err) => {
      console.error('File stream error:', err);
      // Clean up temp file
      try {
        await fs.promises.unlink(tempBackupPath);
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Failed to download backup. Please try again.'
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Error generating backup:', error);

    // Clean up temp file
    try {
      await fs.promises.unlink(tempBackupPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
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

    // Execute database restore programmatically (no psql binary required)
    try {
      // Read SQL file
      const sqlContent = await fs.promises.readFile(databaseSqlPath, 'utf-8');

      // Remove comment lines first
      const cleanedContent = sqlContent
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');

      // Split SQL into individual statements by semicolon followed by newline
      // This avoids splitting on semicolons within statements (like in DEFAULT clauses)
      const statements = [];
      let currentStatement = '';

      for (const line of cleanedContent.split('\n')) {
        currentStatement += line + '\n';
        // If line ends with semicolon, it's the end of a statement
        if (line.trim().endsWith(';')) {
          statements.push(currentStatement.trim().slice(0, -1)); // Remove trailing semicolon
          currentStatement = '';
        }
      }

      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }

      const validStatements = statements.filter(stmt => stmt.length > 0);
      console.log(`[Restore] Executing ${validStatements.length} SQL statements...`);

      // Execute each statement sequentially
      for (let i = 0; i < validStatements.length; i++) {
        const statement = validStatements[i];
        try {
          await pool.query(statement);
        } catch (stmtError) {
          console.error(`[Restore] Error in statement ${i + 1}:`);
          console.error(statement.substring(0, 200));
          throw stmtError;
        }
      }

      console.log('[Restore] Database restored successfully');
    } catch (dbError) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);

      console.error('[Restore] Database restore error:', dbError);

      // Handle specific database errors
      if (dbError.code === 'ECONNREFUSED' || dbError.message.includes('connect')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Unable to connect to database. Please verify database is running.'
        });
      }

      if (dbError.code === '42601' || dbError.message.includes('syntax error')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Backup file contains invalid SQL. Please verify backup integrity.'
        });
      }

      if (dbError.message.includes('timeout')) {
        return res.status(500).json({
          error: 'ServerError',
          message: 'Database restore timed out. Please try again with a smaller backup.'
        });
      }

      // Generic database error
      return res.status(500).json({
        error: 'ServerError',
        message: `Database restore failed: ${dbError.message}`
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

/**
 * GET /api/backup/google-drive/auth-url
 * Get Google Drive OAuth authorization URL
 */
export async function getGoogleDriveAuthUrl(req, res) {
  try {
    const authUrl = getAuthUrl();
    return res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to generate Google Drive authorization URL'
    });
  }
}

/**
 * GET /api/backup/google-drive/callback
 * Handle Google Drive OAuth callback
 */
export async function handleGoogleDriveCallback(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({
      error: 'ValidationError',
      message: 'Authorization code not provided'
    });
  }

  try {
    await exchangeCodeForTokens(code);

    // Restart scheduler if backups are enabled
    await restartScheduler();

    // Redirect to settings page with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    return res.redirect(`${frontendUrl}/settings?google_drive=connected`);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    return res.redirect(`${frontendUrl}/settings?google_drive=error`);
  }
}

/**
 * GET /api/backup/google-drive/status
 * Check if authenticated with Google Drive
 */
export async function getGoogleDriveStatus(req, res) {
  try {
    const authenticated = await isAuthenticated();
    return res.json({ authenticated });
  } catch (error) {
    console.error('Error checking Google Drive status:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to check Google Drive status'
    });
  }
}

/**
 * GET /api/backup/settings
 * Get backup settings
 */
export async function getBackupSettings(req, res) {
  try {
    const result = await pool.query('SELECT * FROM backup_settings WHERE id = 1');

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'Backup settings not found'
      });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching backup settings:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to fetch backup settings'
    });
  }
}

/**
 * PUT /api/backup/settings
 * Update backup settings
 */
export async function updateBackupSettings(req, res) {
  const { enabled, schedule_cron, retention_days } = req.body;

  try {
    // Validate inputs
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'enabled must be a boolean'
      });
    }

    if (retention_days !== undefined && (typeof retention_days !== 'number' || retention_days < 1 || retention_days > 365)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'retention_days must be a number between 1 and 365'
      });
    }

    // Build update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }

    if (schedule_cron !== undefined) {
      updates.push(`schedule_cron = $${paramIndex++}`);
      values.push(schedule_cron);
    }

    if (retention_days !== undefined) {
      updates.push(`retention_days = $${paramIndex++}`);
      values.push(retention_days);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'No valid fields to update'
      });
    }

    updates.push('updated_at = NOW()');

    const sql = `
      UPDATE backup_settings
      SET ${updates.join(', ')}
      WHERE id = 1
      RETURNING *
    `;

    const result = await pool.query(sql, values);

    // Restart scheduler with new settings
    await restartScheduler();

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating backup settings:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to update backup settings'
    });
  }
}

/**
 * POST /api/backup/trigger-manual
 * Manually trigger a backup now
 */
export async function triggerManual(req, res) {
  try {
    const result = await triggerManualBackup();

    if (result.success) {
      return res.json({
        message: 'Backup completed successfully',
        fileName: result.fileName,
        fileId: result.fileId
      });
    } else {
      console.error('[triggerManual] Backup failed:', result.error);
      return res.status(500).json({
        error: 'ServerError',
        message: result.error || 'Backup failed'
      });
    }
  } catch (error) {
    console.error('[triggerManual] Error triggering manual backup:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: error.message || 'Failed to trigger backup'
    });
  }
}

/**
 * GET /api/backup/list
 * List all backups in Google Drive
 */
export async function listGoogleDriveBackups(req, res) {
  try {
    const backups = await listBackups();
    return res.json({ backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to list backups'
    });
  }
}
