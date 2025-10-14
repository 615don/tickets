import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';
import { createBackupZip } from '../services/databaseBackupService.js';
import { uploadBackup, isAuthenticated, getAuthUrl, exchangeCodeForTokens, listBackups, deleteOldBackups } from '../services/googleDriveService.js';
import { triggerManualBackup, restartScheduler } from '../services/backupScheduler.js';
import { safeError } from '../utils/logSanitizer.js';

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
        safeError('Failed to clean up temp file:', cleanupError);
      }
    });

    fileStream.on('error', async (err) => {
      safeError('File stream error:', err);
      // Clean up temp file
      try {
        await fs.promises.unlink(tempBackupPath);
      } catch (cleanupError) {
        safeError('Failed to clean up temp file:', cleanupError);
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
    safeError('Error generating backup:', error);

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
      console.log('[Restore] Clearing existing data...');

      // Get all tables to truncate (except session table - will be cleared later)
      const tablesResult = await pool.query(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND tablename != 'session'
        ORDER BY tablename
      `);

      // Truncate all tables with CASCADE to handle foreign keys
      if (tablesResult.rows.length > 0) {
        const tableNames = tablesResult.rows.map(r => r.tablename).join(', ');
        await pool.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
        console.log(`[Restore] Cleared ${tablesResult.rows.length} tables`);
      }

      // Read SQL file
      let sqlContent = await fs.promises.readFile(databaseSqlPath, 'utf-8');

      // Remove SQL comment lines (starting with --)
      sqlContent = sqlContent
        .split('\n')
        .filter(line => {
          const trimmed = line.trim();
          return !trimmed.startsWith('--') || trimmed.length === 0;
        })
        .join('\n');

      // Split by semicolon+newline pattern (statement terminators)
      // Use regex to split on ";\n" which marks end of statements
      const statements = sqlContent
        .split(/;\s*\n/)
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      console.log(`[Restore] Executing ${statements.length} SQL statements...`);

      // Execute each statement sequentially
      let successCount = 0;
      let skipCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          await pool.query(statement);
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`[Restore] Progress: ${i + 1}/${statements.length} statements executed (${successCount} successful, ${skipCount} skipped)`);
          }
        } catch (stmtError) {
          // Skip errors for objects that already exist (idempotent restore)
          if (stmtError.code === '42P07' || stmtError.code === '23505') {
            // 42P07 = duplicate object (table, index, etc.)
            // 23505 = unique violation
            console.log(`[Restore] Skipping statement ${i + 1} (already exists): ${statement.substring(0, 100)}`);
            skipCount++;
            continue;
          }

          // Skip session table errors (sessions are temporary and not critical)
          if (statement.includes('INSERT INTO session') || statement.includes('INSERT INTO "session"')) {
            console.log(`[Restore] Skipping session data error (non-critical): ${stmtError.message}`);
            skipCount++;
            continue;
          }

          // For other errors, log and fail
          console.error(`[Restore] Error in statement ${i + 1}:`);
          console.error(`First 300 chars: ${statement.substring(0, 300)}`);
          console.error(`Error: ${stmtError.message}`);
          throw stmtError;
        }
      }

      console.log(`[Restore] Restore completed: ${successCount} successful, ${skipCount} skipped`);

      console.log('[Restore] Database restored successfully');
    } catch (dbError) {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
      await fs.promises.unlink(uploadedFile);

      safeError('[Restore] Database restore error:', dbError);

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
      safeError('Failed to invalidate sessions:', sessionError);
      // Continue even if session invalidation fails - restore was successful
    }

    // Initialize singleton configuration tables if they are empty after restore
    // This handles cases where backups were taken before these features existed
    try {
      console.log('[Restore] Checking singleton configuration tables...');

      // Check and initialize ai_settings if empty
      const aiSettingsCheck = await pool.query('SELECT COUNT(*) FROM ai_settings');
      if (parseInt(aiSettingsCheck.rows[0].count) === 0) {
        console.log('[Restore] Initializing ai_settings with default row...');
        await pool.query(`
          INSERT INTO ai_settings (id, openai_api_key, openai_model, system_prompt, max_completion_tokens, max_word_count, api_timeout_ms)
          VALUES (1, '', 'gpt-5-mini', 'You are an AI assistant helping to summarize email threads for IT consulting ticket creation.

Generate two outputs:
1. Description: A concise one-line summary suitable for invoice line items (max 100 characters)
2. Notes: A detailed summary of the email thread for billing reference and memory jogging

Rules:
- Focus on technical issues, requests, and context
- Preserve important details (error messages, dates, versions, steps taken)
- Omit pleasantries and signature content
- Adjust summary length based on email content length (short emails = brief notes, long threads = detailed notes)
- Use professional, neutral tone

IMPORTANT: You must respond with ONLY valid JSON. Do not include any text before or after the JSON object. Do not use markdown code blocks. Output raw JSON only.

Respond with this exact JSON format:
{
  "description": "one-line summary here",
  "notes": "detailed multi-paragraph summary here"
}', 2000, 4000, 15000)
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('[Restore] ai_settings initialized successfully');
      }

      // Check and initialize backup_settings if empty
      const backupSettingsCheck = await pool.query('SELECT COUNT(*) FROM backup_settings');
      if (parseInt(backupSettingsCheck.rows[0].count) === 0) {
        console.log('[Restore] Initializing backup_settings with default row...');
        await pool.query(`
          INSERT INTO backup_settings (id, enabled, schedule_cron, retention_days)
          VALUES (1, false, '0 0 * * *', 10)
          ON CONFLICT (id) DO NOTHING
        `);
        console.log('[Restore] backup_settings initialized successfully');
      }
    } catch (singletonError) {
      safeError('[Restore] Error initializing singleton tables:', singletonError);
      // Continue even if singleton initialization fails - restore was successful
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
    safeError('Error restoring backup:', error);

    // Clean up temporary files
    try {
      await fs.promises.rm(extractDir, { recursive: true, force: true });
    } catch (cleanupError) {
      safeError('Failed to clean up extraction directory:', cleanupError);
    }

    try {
      await fs.promises.unlink(uploadedFile);
    } catch (cleanupError) {
      safeError('Failed to clean up uploaded file:', cleanupError);
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
    safeError('Error generating auth URL:', error);
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
    safeError('Error exchanging code for tokens:', error);
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
    safeError('Error checking Google Drive status:', error);
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
    safeError('Error fetching backup settings:', error);
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
    safeError('Error updating backup settings:', error);
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
      safeError('[triggerManual] Backup failed:', result.error);
      return res.status(500).json({
        error: 'ServerError',
        message: result.error || 'Backup failed'
      });
    }
  } catch (error) {
    safeError('[triggerManual] Error triggering manual backup:', error);
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
    safeError('Error listing backups:', error);
    return res.status(500).json({
      error: 'ServerError',
      message: 'Failed to list backups'
    });
  }
}
