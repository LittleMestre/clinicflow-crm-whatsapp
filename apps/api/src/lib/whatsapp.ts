export const normalizePhone = (value: string) => value.replace(/\D/g, '');
export const isMockMode = () => process.env.WHATSAPP_MODE !== 'live';

export interface WebhookChange {
  value?: {
    metadata?: { phone_number_id?: string };
    contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
    messages?: Array<{ id?: string; from?: string; type?: string; text?: { body?: string }; interactive?: { button_reply?: { title?: string } } }>;
    statuses?: Array<{ id?: string; status?: string }>;
  };
}
export interface WhatsAppWebhook {
  entry?: Array<{ changes?: WebhookChange[] }>;
}
export function getWebhookChanges(event: WhatsAppWebhook): WebhookChange[] {
  return (event.entry ?? []).flatMap(e => e.changes ?? []);
}
export async function sendWhatsAppText(params: { token: string; phoneNumberId: string; to: string; body: string }) {
  const version = process.env.META_GRAPH_VERSION || 'v26.0';
  const response = await fetch(`https://graph.facebook.com/${version}/${encodeURIComponent(params.phoneNumberId)}/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${params.token}` },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: params.to, type: 'text', text: { preview_url: false, body: params.body } }),
    signal: AbortSignal.timeout(15000)
  });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(`Meta API retornou erro HTTP ${response.status}. Verifique o token e a janela de atendimento.`);
  const obj = data as { messages?: Array<{ id?: string }> };
  const messageId = obj.messages?.[0]?.id;
  if (!messageId) throw new Error('Meta não retornou o identificador da mensagem');
  return messageId;
}
