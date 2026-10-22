import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { identity } from '../lib/auth.js';
import { encryptSecret } from '../lib/security.js';
import { HttpError, route } from '../lib/http.js';
import { isMockMode } from '../lib/whatsapp.js';

export const settingsRoutes = Router();
settingsRoutes.get('/whatsapp', route(async (req, res) => {
  const org = identity(req).organization_id;
  const record = await query('SELECT phone_number_id, display_number, updated_at FROM whatsapp_channels WHERE organization_id=$1', [org]);
  res.json({ mode: isMockMode() ? 'mock' : 'live', connected: !!record.rowCount, channel: record.rows[0] ?? null });
}));
settingsRoutes.put('/whatsapp', route(async (req, res) => {
  if (identity(req).role !== 'admin') throw new HttpError(403, 'Somente administradores podem editar integrações');
  const body = z.object({ phone_number_id: z.string().regex(/^\d{6,30}$/, 'ID do telefone inválido'), display_number: z.string().max(30).default(''), access_token: z.string().min(15).max(4096) }).parse(req.body);
  const org = identity(req).organization_id;
  try {
    await query(`INSERT INTO whatsapp_channels (organization_id,phone_number_id,display_number,encrypted_access_token)
      VALUES ($1,$2,$3,$4) ON CONFLICT (organization_id) DO UPDATE SET phone_number_id=EXCLUDED.phone_number_id,
      display_number=EXCLUDED.display_number, encrypted_access_token=EXCLUDED.encrypted_access_token, updated_at=now()`,
    [org, body.phone_number_id, body.display_number, encryptSecret(body.access_token)]);
    res.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new HttpError(409, 'Este número já pertence a outra organização');
    throw error;
  }
}));
settingsRoutes.delete('/whatsapp', route(async (req, res) => {
  if (identity(req).role !== 'admin') throw new HttpError(403, 'Somente administradores podem editar integrações');
  await query('DELETE FROM whatsapp_channels WHERE organization_id=$1', [identity(req).organization_id]);
  res.json({ ok: true });
}));
