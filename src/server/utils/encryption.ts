import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ITERATIONS = 100000;
const PREFIX = 'enc:';

function getSalt(): string | null {
  return process.env.QUICK_PRESS_ENCRYPT_SALT || null;
}

function deriveKey(salt: string): Buffer {
  return pbkdf2Sync(salt, 'quick-press', ITERATIONS, KEY_LENGTH, 'sha512');
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function hasEncryptionKey(): boolean {
  return !!getSalt();
}

export function encrypt(plaintext: string): string {
  const salt = getSalt();
  if (!salt) return plaintext;

  const key = deriveKey(salt);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return PREFIX + iv.toString('base64') + ':' + encrypted.toString('base64') + ':' + authTag.toString('base64');
}

export function decrypt(ciphertext: string): string {
  if (!isEncrypted(ciphertext)) return ciphertext;

  const salt = getSalt();
  if (!salt) return ciphertext;

  const payload = ciphertext.slice(PREFIX.length);
  const parts = payload.split(':');
  if (parts.length !== 3) return ciphertext;

  const [ivB64, encB64, tagB64] = parts;
  const key = deriveKey(salt);
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encB64, 'base64');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
