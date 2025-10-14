import cron from 'node-cron';
import pool from '../config/database.js';
import { createBackupZip } from './databaseBackupService.js';
import { uploadBackup, deleteOldBackups, isAuthenticated } from './googleDriveService.js';
import fs from 'fs';

/**
 * Backup Scheduler Service
 * Manages automated database backups to Google Drive
 */

let scheduledTask = null;

/**
 * Get backup settings from database
 */
async function getBackupSettings() {
  const result = await pool.query('SELECT * FROM backup_settings WHERE id = 1');
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
}

/**
 * Update backup settings in database
 */
async function updateBackupSettings(updates) {
  const fields = [];
  const values = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = $${paramIndex}`);
    values.push(value);
    paramIndex++;
  });

  const sql = `
    UPDATE backup_settings
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE id = 1
    RETURNING *
  `;

  const result = await pool.query(sql, values);
  return result.rows[0];
}

/**
 * Perform backup and upload to Google Drive
 */
async function performBackup() {
  const timestamp = new Date().toISOString().replace(/:/g, '').replace(/\..+/, '').replace('T', '-').substring(0, 17);
  const tempBackupPath = `/tmp/backup-${timestamp}.zip`;

  try {
    console.log(`[Backup] Starting scheduled backup at ${new Date().toISOString()}`);

    // Check if authenticated with Google Drive
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      throw new Error('Not authenticated with Google Drive. Please configure Google Drive integration.');
    }

    // Create backup ZIP
    console.log('[Backup] Generating database dump...');
    await createBackupZip(tempBackupPath);

    // Upload to Google Drive
    console.log('[Backup] Uploading to Google Drive...');
    const fileName = `backup-${timestamp}.zip`;
    const uploadedFile = await uploadBackup(tempBackupPath, fileName);

    console.log(`[Backup] Successfully uploaded: ${uploadedFile.name} (${uploadedFile.size} bytes)`);

    // Clean up local file
    await fs.promises.unlink(tempBackupPath);

    // Clean up old backups based on retention policy
    const settings = await getBackupSettings();
    if (settings && settings.retention_days > 0) {
      console.log(`[Backup] Cleaning up backups older than ${settings.retention_days} days...`);
      const deletedCount = await deleteOldBackups(settings.retention_days);
      console.log(`[Backup] Deleted ${deletedCount} old backup(s)`);
    }

    // Update backup status
    await updateBackupSettings({
      last_backup_at: new Date(),
      last_backup_status: 'success',
      last_backup_error: null
    });

    console.log('[Backup] Backup completed successfully');
    return { success: true, fileName, fileId: uploadedFile.id };

  } catch (error) {
    console.error('[Backup] Backup failed:', error);

    // Clean up local file if exists
    try {
      await fs.promises.unlink(tempBackupPath);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }

    // Update backup status
    await updateBackupSettings({
      last_backup_at: new Date(),
      last_backup_status: 'failed',
      last_backup_error: error.message
    });

    return { success: false, error: error.message };
  }
}

/**
 * Start backup scheduler
 */
export async function startScheduler() {
  const settings = await getBackupSettings();

  if (!settings || !settings.enabled) {
    console.log('[Backup Scheduler] Automated backups disabled');
    return;
  }

  // Stop existing scheduler if running
  if (scheduledTask) {
    scheduledTask.stop();
  }

  // Validate cron expression
  if (!cron.validate(settings.schedule_cron)) {
    console.error(`[Backup Scheduler] Invalid cron expression: ${settings.schedule_cron}`);
    return;
  }

  // Start new scheduler
  scheduledTask = cron.schedule(settings.schedule_cron, async () => {
    await performBackup();
  });

  console.log(`[Backup Scheduler] Scheduled backups enabled: ${settings.schedule_cron}`);
  console.log(`[Backup Scheduler] Retention policy: ${settings.retention_days} days`);
}

/**
 * Stop backup scheduler
 */
export function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[Backup Scheduler] Stopped');
  }
}

/**
 * Restart backup scheduler (call after settings change)
 */
export async function restartScheduler() {
  stopScheduler();
  await startScheduler();
}

/**
 * Manually trigger backup (for testing or manual backups)
 */
export async function triggerManualBackup() {
  return await performBackup();
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning: scheduledTask !== null
  };
}
