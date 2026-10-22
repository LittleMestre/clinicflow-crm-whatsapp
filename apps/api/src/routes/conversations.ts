import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { identity } from '../lib/auth.js';
import { HttpError, route } from '../lib/http.js';
import { decryptSecret } from '../lib/security.js';
import { isMockMode, sendWhatsAppText } from '../lib/whatsapp.js';

export const conversationRoutes = Router();
conversationRoutes.get('/', route(async (req, res) => {
  const org = identity(req).organization_id;
  const records = await query(`SELECT c.id, c.name, c.phone, c.opted_in,
    coalesce(last_m.body,'Iniciar conversa') AS last_message, last_m.created_at AS last_at,
    (SELECT count(*)::int FROM messages unread WHERE unread.contact_id=c.id AND unread.organization_id=$1 AND unread.direction='inbound' AND NOT unread.is_read) AS unread
    FROM contacts c
    LEFT JOIN LATERAL (SELECT body, created_at FROM messages WHERE contact_id=c.id AND organization_id=$1 ORDER BY created_at DESC LIMIT 1) last_m ON TRUE
    WHERE c.organization_id=$1 AND NOT c.archived ORDER BY last_m.created_at DESC NULLS LAST, c.name ASC LIMIT 100`, [org]);
  res.json(records.rows);
}));
conversationRoutes.get('/:contactId/messages', route(async (req, res) => {
  const org = identity(req).organization_id;
  const contact = await query('SELECT id FROM contacts WHERE id=$1 AND organization_id=$2', [req.params.contactId, org]);
  if (!contact.rowCount) throw new HttpError(404, 'Contato não encontrado');
  const rows = await query(`SELECT id, direction, body, status, created_at FROM
      (SELECT id, direction, body, status, created_at FROM messages WHERE contact_id=$1 AND organization_id=$2 ORDER BY created_at DESC LIMIT 100) AS recent
      ORDER BY created_at ASC`, [req.params.contactId, org]);
  await query('UPDATE messages SET is_read=TRUE WHERE contact_id=$1 AND organization_id=$2 AND direction=\'inbound\' AND is_read=FALSE', [req.params.contactId, org]);
  res.json(rows.rows);
}));
conversationRoutes.post('/:contactId/messages', route(async (req, res) => {
  const { body } = z.object({ body: z.string().trim().min(1).max(4096) }).parse(req.body);
  const org = identity(req).organization_id;
  const contact = await query<{ phone: string; opted_in: boolean }>('SELECT phone, opted_in FROM contacts WHERE id=$1 AND organization_id=$2 AND archived=FALSE', [req.params.contactId, org]);
  if (!contact.rowCount) throw new HttpError(404, 'Contato não encontrado');
  if (!contact.rows[0].opted_in) throw new HttpError(403, 'Contato sem consentimento para mensagens');
  let status = 'simulated';
  let providerId: string | null = null;
  if (!isMockMode()) {
    // The sample tenant uses synthetic data; never let it contact real WhatsApp numbers.
    if (org === '10000000-0000-4000-8000-000000000001') throw new HttpError(403, 'A organização demo não pode enviar mensagens reais. Crie seu próprio workspace.');
    const channel = await query<{ phone_number_id: string; encrypted_access_token: string }>('SELECT phone_number_id, encrypted_access_token FROM whatsapp_channels WHERE organization_id=$1', [org]);
    if (!channel.rowCount) throw new HttpError(409, 'Conecte seu número em Configurações antes de enviar');
    const lastInbound = await query('SELECT id FROM messages WHERE organization_id=$1 AND contact_id=$2 AND direction=\'inbound\' AND created_at > now() - interval \'24 hours\' LIMIT 1', [org, req.params.contactId]);
    if (!lastInbound.rowCount) throw new HttpError(409, 'Janela de 24h encerrada: é necessário um template aprovado pela Meta (não implementado nesta versão)');
    try {
      providerId = await sendWhatsAppText({ token: decryptSecret(channel.rows[0].encrypted_access_token), phoneNumberId: channel.rows[0].phone_number_id, to: contact.rows[0].phone, body });
      status = 'sent';
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') throw new HttpError(504, 'A Meta não respondeu. Verifique o painel antes de tentar novamente para evitar mensagens duplicadas.');
      throw new HttpError(502, error instanceof Error ? error.message : 'Falha ao enviar mensagem pela Meta');
    }
  }
  const result = await query('INSERT INTO messages (organization_id, contact_id, direction, body, status, wa_message_id, is_read) VALUES ($1,$2,\'outbound\',$3,$4,$5,TRUE) RETURNING *', [org, req.params.contactId, body, status, providerId]);
  res.status(201).json(result.rows[0]);
}));
