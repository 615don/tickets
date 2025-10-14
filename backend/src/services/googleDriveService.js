import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import pool from '../config/database.js';

/**
 * Google Drive Service for backup management
 * Handles OAuth authentication and file uploads to Google Drive
 */

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

/**
 * Create OAuth2 client
 */
function getOAuthClient() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google Drive credentials not configured');
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl() {
  const oauth2Client = getOAuthClient();

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent' // Force consent screen to get refresh token
  });
}

/**
 * Exchange authorization code for tokens and store in database
 */
export async function exchangeCodeForTokens(code) {
  const oauth2Client = getOAuthClient();

  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens in database
  await pool.query(
    `INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expiry_date = EXCLUDED.expiry_date,
       updated_at = NOW()`,
    [tokens.access_token, tokens.refresh_token, tokens.expiry_date]
  );

  return tokens;
}

/**
 * Get stored tokens from database
 */
async function getStoredTokens() {
  const result = await pool.query(
    'SELECT access_token, refresh_token, expiry_date FROM google_drive_tokens ORDER BY id DESC LIMIT 1'
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  return {
    access_token: row.access_token,
    refresh_token: row.refresh_token,
    expiry_date: row.expiry_date
  };
}

/**
 * Update stored tokens in database
 */
async function updateStoredTokens(tokens) {
  await pool.query(
    `UPDATE google_drive_tokens SET
       access_token = $1,
       refresh_token = COALESCE($2, refresh_token),
       expiry_date = $3,
       updated_at = NOW()
     WHERE id = (SELECT id FROM google_drive_tokens ORDER BY id DESC LIMIT 1)`,
    [tokens.access_token, tokens.refresh_token, tokens.expiry_date]
  );
}

/**
 * Get authenticated OAuth2 client
 */
async function getAuthenticatedClient() {
  const oauth2Client = getOAuthClient();
  const tokens = await getStoredTokens();

  if (!tokens) {
    throw new Error('Not authenticated with Google Drive');
  }

  oauth2Client.setCredentials(tokens);

  // Automatically refresh token if expired
  oauth2Client.on('tokens', async (newTokens) => {
    await updateStoredTokens(newTokens);
  });

  return oauth2Client;
}

/**
 * Check if authenticated with Google Drive
 */
export async function isAuthenticated() {
  const tokens = await getStoredTokens();
  return tokens !== null;
}

/**
 * Get or create "Ticketing System Backups" folder in Google Drive
 */
async function getOrCreateBackupFolder(drive) {
  // Search for existing folder
  const response = await drive.files.list({
    q: "name='Ticketing System Backups' and mimeType='application/vnd.google-apps.folder' and trashed=false",
    fields: 'files(id, name)',
    spaces: 'drive'
  });

  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }

  // Create folder if it doesn't exist
  const folderMetadata = {
    name: 'Ticketing System Backups',
    mimeType: 'application/vnd.google-apps.folder'
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id'
  });

  return folder.data.id;
}

/**
 * Upload backup file to Google Drive
 * @param {string} filePath - Local path to backup ZIP file
 * @param {string} fileName - Name for file in Google Drive
 * @returns {Promise<string>} - Google Drive file ID
 */
export async function uploadBackup(filePath, fileName) {
  const oauth2Client = await getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get or create backup folder
  const folderId = await getOrCreateBackupFolder(drive);

  // Upload file
  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const media = {
    mimeType: 'application/zip',
    body: fs.createReadStream(filePath)
  };

  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, name, size, createdTime'
  });

  return file.data;
}

/**
 * List all backup files in Google Drive
 * @returns {Promise<Array>} - List of backup files
 */
export async function listBackups() {
  const oauth2Client = await getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get backup folder
  const folderId = await getOrCreateBackupFolder(drive);

  // List files in folder
  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id, name, size, createdTime)',
    orderBy: 'createdTime desc',
    spaces: 'drive'
  });

  return response.data.files;
}

/**
 * Delete old backups based on retention policy
 * @param {number} retentionDays - Number of days to keep backups
 */
export async function deleteOldBackups(retentionDays) {
  const oauth2Client = await getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const backups = await listBackups();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const filesToDelete = backups.filter(file => {
    const fileDate = new Date(file.createdTime);
    return fileDate < cutoffDate;
  });

  for (const file of filesToDelete) {
    await drive.files.delete({ fileId: file.id });
    console.log(`Deleted old backup: ${file.name} (created: ${file.createdTime})`);
  }

  return filesToDelete.length;
}

/**
 * Download backup file from Google Drive
 * @param {string} fileId - Google Drive file ID
 * @param {string} destPath - Local destination path
 */
export async function downloadBackup(fileId, destPath) {
  const oauth2Client = await getAuthenticatedClient();
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );

  const dest = fs.createWriteStream(destPath);

  return new Promise((resolve, reject) => {
    response.data
      .on('end', () => resolve())
      .on('error', reject)
      .pipe(dest);
  });
}
