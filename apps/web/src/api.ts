export type User = { id: string; name: string; role: string; organization_id: string; organization_name: string; demo_mode: boolean };
export type Contact = { id: string; name: string; phone: string; email: string; tags: string[]; opted_in: boolean; created_at: string };
export type Stage = 'new' | 'qualified' | 'proposal' | 'won' | 'lost';
export type Deal = { id: string; contact_id: string; contact_name: string; title: string; value_cents: number; stage: Stage; created_at: string };
export type Message = { id: string; direction: 'inbound'|'outbound'; body: string; status: string; created_at: string };
export type Thread = { id: string; name: string; phone: string; opted_in: boolean; last_message: string; last_at: string | null; unread: number };
export type DashboardData = { contacts: number; open_deals: number; won_cents: string; unread: number; stages: Array<{stage: Stage; count: number}>; recent: Array<Message & {contact_name: string}>; trend: Array<{month: string; count: number}> };
export type ChannelData = { mode: 'mock'|'live'; connected: boolean; channel: null | {phone_number_id: string; display_number: string; updated_at: string} };

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { ...(init?.body ? {'content-type': 'application/json'} : {}), ...init?.headers }
  });
  const data = await response.json().catch(() => ({ error: 'Resposta inválida do servidor' }));
  if (!response.ok) throw new Error(data.error || `Erro HTTP ${response.status}`);
  return data as T;
}
export const post = <T>(path: string, data: unknown) => api<T>(path, { method: 'POST', body: JSON.stringify(data) });
export const patch = <T>(path: string, data: unknown) => api<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
export const put = <T>(path: string, data: unknown) => api<T>(path, { method: 'PUT', body: JSON.stringify(data) });
export const currency = (cents: number | string) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(cents) / 100);
export const dateShort = (value: string) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
export const clock = (value: string) => new Date(value).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
export const initials = (name: string) => name.trim().split(/\s+/).slice(0,2).map(n=>n[0]||'').join('').toUpperCase();
export const stages: Array<{id: Stage; label: string; color: string}> = [
  {id:'new', label:'Novo lead', color:'#6d8bb2'}, {id:'qualified', label:'Qualificado', color:'#8767dc'},
  {id:'proposal', label:'Proposta', color:'#e4a247'}, {id:'won', label:'Ganho', color:'#20a885'}, {id:'lost', label:'Perdido', color:'#e07070'}
];
