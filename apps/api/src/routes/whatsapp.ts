import { Router } from 'express';
import { query } from '../lib/db.js';
import { route } from '../lib/http.js';
import { verifyMetaSignature } from '../lib/security.js';
import { getWebhookChanges, normalizePhone, type WhatsAppWebhook } from '../lib/whatsapp.js';

export const whatsappRoutes = Router();
whatsappRoutes.get('/', (req, res) => {
  const token = process.env.META_VERIFY_TOKEN;
  if (token && req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === token && typeof req.query['hub.challenge'] === 'string') {
    return res.status(200).type('text/plain').send(req.query['hub.challenge']);
  }
  return res.status(403).send('Forbidden');
});
whatsappRoutes.post('/', route(async (req, res) => {
  const raw = req.body as Buffer;
  if (!Buffer.isBuffer(raw) || !verifyMetaSignature(raw, req.header('x-hub-signature-256'), process.env.META_APP_SECRET || '')) {
    return res.status(401).json({ error: 'Assinatura inválida' });
  }
  let payload: WhatsAppWebhook;
  try { payload = JSON.parse(raw.toString('utf8')) as WhatsAppWebhook; }
  catch { return res.status(400).json({ error: 'JSON inválido' }); }
  for (const change of getWebhookChanges(payload)) {
    const value = change.value;
    const phoneId = value?.metadata?.phone_number_id;
    if (!phoneId) continue;
    const channel = await query<{ organization_id: string }>('SELECT organization_id FROM whatsapp_channels WHERE phone_number_id=$1', [phoneId]);
    if (!channel.rowCount) continue;
    const org = channel.rows[0].organization_id;
    for (const event of value?.messages ?? []) {
      const phone = normalizePhone(event.from ?? '');
      const body = event.text?.body || event.interactive?.button_reply?.title;
      if (!event.id || phone.length < 10 || !body) continue;
      const name = value?.contacts?.find(c => c.wa_id === event.from)?.profile?.name?.slice(0, 120) || `WhatsApp ${phone.slice(-4)}`;
      const contact = await query<{ id: string }>(`INSERT INTO contacts (organization_id,name,phone,opted_in) VALUES($1,$2,$3,TRUE)
        ON CONFLICT (organization_id,phone) DO UPDATE SET archived=FALSE, opted_in=TRUE RETURNING id`, [org, name, phone]);
      await query(`INSERT INTO messages (organization_id,contact_id,direction,body,status,wa_message_id,is_read)
        VALUES($1,$2,'inbound',$3,'received',$4,FALSE) ON CONFLICT (wa_message_id) DO NOTHING`, [org, contact.rows[0].id, body.slice(0, 4096), event.id]);
    }
    for (const event of value?.statuses ?? []) {
      if (!event.id || !['sent', 'delivered', 'read', 'failed'].includes(event.status ?? '')) continue;
      await query('UPDATE messages SET status=$3 WHERE organization_id=$1 AND wa_message_id=$2 AND direction=\'outbound\'', [org, event.id, event.status]);
    }
  }
  res.status(200).send('EVENT_RECEIVED');
}));
