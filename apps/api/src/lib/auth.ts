import type { Request, Response, NextFunction } from 'express';
import { query } from './db.js';
import { hashSessionToken } from './security.js';

export type Identity = { id: string; name: string; role: 'admin' | 'agent'; organization_id: string; organization_name: string };
declare global { namespace Express { interface Request { identity?: Identity } } }

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const cookie = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('clinicflow_session='));
    const token = cookie?.slice('clinicflow_session='.length);
    if (!token || !/^[0-9a-f]{64}$/i.test(token)) return res.status(401).json({ error: 'Faça login para continuar' });
    const result = await query<Identity>(`
      SELECT u.id, u.name, u.role, u.organization_id, o.name AS organization_name
      FROM sessions s JOIN users u ON u.id = s.user_id
      JOIN organizations o ON o.id = u.organization_id
      WHERE s.token_hash = $1 AND s.expires_at > now()`, [hashSessionToken(token)]);
    if (!result.rowCount) return res.status(401).json({ error: 'Sessão expirada' });
    req.identity = result.rows[0];
    next();
  } catch (error) { next(error); }
}
export const identity = (req: Request): Identity => {
  if (!req.identity) throw new Error('Middleware de autenticação ausente');
  return req.identity;
};
