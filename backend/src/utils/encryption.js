import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for AES-GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag
const KEY_LENGTH = 32; // 32 bytes (256 bits)

/**
 * Encrypts plaintext using AES-256-GCM authenticated encryption
 * @param {string} plaintext - The text to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:ciphertext (hex-encoded)
 * @throws {Error} If AI_ENCRYPTION_KEY environment variable is not configured
 */
export function encrypt(plaintext) {
  // Validate encryption key is configured
  const encryptionKey = process.env.AI_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('AI_ENCRYPTION_KEY environment variable is not configured');
  }

  // Convert hex string to buffer
  const key = Buffer.from(encryptionKey, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AI_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }

  // Generate random IV for this encryption
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the plaintext
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:ciphertext (all hex-encoded)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext}`;
}

/**
 * Decrypts data encrypted with encrypt() function
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 * @throws {Error} If decryption fails or data is invalid
 */
export function decrypt(encryptedData) {
  // Validate encryption key is configured
  const encryptionKey = process.env.AI_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('AI_ENCRYPTION_KEY environment variable is not configured');
  }

  // Convert hex string to buffer
  const key = Buffer.from(encryptionKey, 'hex');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AI_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 2} hex characters)`);
  }

  try {
    // Parse encrypted data format
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format. Expected: iv:authTag:ciphertext');
    }

    const [ivHex, authTagHex, ciphertext] = parts;

    // Convert from hex to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the ciphertext
    let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
    plaintext += decipher.final('utf8');

    return plaintext;
  } catch (error) {
    // Handle decryption errors gracefully
    if (error.message.includes('Unsupported state or unable to authenticate data')) {
      throw new Error('Decryption failed: Data has been tampered with or encryption key is incorrect');
    }
    throw new Error(`Decryption failed: ${error.message}`);
  }
}
