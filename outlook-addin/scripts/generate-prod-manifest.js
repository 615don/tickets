#!/usr/bin/env node

/**
 * Generate production manifest by replacing localhost URLs with production URLs
 *
 * This script reads the development manifest and creates a production version
 * by replacing all instances of https://localhost:5173 with the production URL.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_MANIFEST_PATH = path.join(__dirname, '../manifest/outlook-addin-manifest.xml');
const PROD_MANIFEST_PATH = path.join(__dirname, '../manifest/outlook-addin-manifest.prod.xml');
const LOCALHOST_URL = 'https://localhost:5173';
const PRODUCTION_URL = 'https://outlook-addin.zollc.com';

try {
  // Read development manifest
  const devManifest = fs.readFileSync(DEV_MANIFEST_PATH, 'utf8');

  // Replace all localhost URLs with production URL
  const prodManifest = devManifest.replaceAll(LOCALHOST_URL, PRODUCTION_URL);

  // Write production manifest
  fs.writeFileSync(PROD_MANIFEST_PATH, prodManifest, 'utf8');

  console.log('✓ Production manifest generated successfully');
  console.log(`  Input:  ${DEV_MANIFEST_PATH}`);
  console.log(`  Output: ${PROD_MANIFEST_PATH}`);
  console.log(`  Replaced: ${LOCALHOST_URL} → ${PRODUCTION_URL}`);
} catch (error) {
  console.error('✗ Error generating production manifest:', error.message);
  process.exit(1);
}
