import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = process.env.SECRET_KEY || process.env.ENCRYPTION_KEY || 'default_super_secure_secret_key_nextfolio_123!';

// Derive a 32-byte key
const KEY = crypto.createHash('sha256').update(String(SECRET_KEY)).digest();

/**
 * Encrypt a string using AES-256-CBC
 * @param {string} text Plain text to encrypt
 * @returns {string} iv:ciphertext in hex format
 */
export function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt a string using AES-256-CBC
 * @param {string} ciphertext Encrypted text in iv:ciphertext format
 * @returns {string} Decrypted plain text
 */
export function decrypt(ciphertext) {
  if (!ciphertext) return null;
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 2) return null;
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}
