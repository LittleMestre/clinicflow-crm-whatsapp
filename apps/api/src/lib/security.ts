import { createCipheriv, createDecipheriv, createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const createSessionToken = () => randomBytes(32).toString('hex');
export const hashSessionToken = hash;

function encryptionKey(): Buffer {
  const secret = process.env.APP_ENCRYPTION_KEY || '';
  if (!/^[0-9a-f]{64}$/i.test(secret)) throw new Error('APP_ENCRYPTION_KEY precisa ter 64 caracteres hexadecimais');
  return Buffer.from(secret, 'hex');
}
export function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), encrypted.toString('hex')].join(':');
}
export function decryptSecret(value: string): string {
  const [iv, tag, data] = value.split(':');
  if (!iv || !tag || !data) throw new Error('Credencial criptografada inválida');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
}
export function verifyMetaSignature(body: Buffer, header: string | undefined, secret: string): boolean {
  if (!secret || !header || !/^sha256=[a-f0-9]{64}$/i.test(header)) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(body).digest('hex'), 'hex');
  const received = Buffer.from(header.slice(7), 'hex');
  return expected.length === received.length && timingSafeEqual(expected, received);
}
