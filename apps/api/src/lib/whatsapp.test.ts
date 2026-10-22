import { describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import { getWebhookChanges, normalizePhone } from './whatsapp.js';
import { encryptSecret, decryptSecret, verifyMetaSignature } from './security.js';

describe('Integração WhatsApp', () => {
  it('normaliza telefones', () => expect(normalizePhone('+55 (61) 99999-9999')).toBe('5561999999999'));
  it('extrai múltiplas mudanças', () => expect(getWebhookChanges({entry:[{changes:[{value:{}},{value:{}}]}]})).toHaveLength(2));
  it('valida assinatura e rejeita falsificação', () => {
    const raw = Buffer.from('{"hello":"world"}');
    const sig = `sha256=${createHmac('sha256','secret').update(raw).digest('hex')}`;
    expect(verifyMetaSignature(raw,sig,'secret')).toBe(true);
    expect(verifyMetaSignature(Buffer.from('{}'),sig,'secret')).toBe(false);
    expect(verifyMetaSignature(raw,undefined,'secret')).toBe(false);
  });
  it('criptografa credenciais sem retornar texto puro', () => {
    process.env.APP_ENCRYPTION_KEY = 'f'.repeat(64);
    const encrypted = encryptSecret('my-token');
    expect(encrypted).not.toContain('my-token');
    expect(decryptSecret(encrypted)).toBe('my-token');
  });
});
