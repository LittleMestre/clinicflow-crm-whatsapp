import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { pool, query } from '../lib/db.js';
import { authenticate, identity } from '../lib/auth.js';
import { createSessionToken, hashSessionToken } from '../lib/security.js';
import { HttpError, route } from '../lib/http.js';

export const authRoutes = Router();
const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
authRoutes.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }), route(async (req, res) => {
  const parsed = credentials.parse(req.body);
  const user = await query<{ id: string; name: string; organization_id: string; password_hash: string }>('SELECT id, name, organization_id, password_hash FROM users WHERE lower(email) = lower($1)', [parsed.email]);
  const valid = user.rows[0] && await bcrypt.compare(parsed.password, user.rows[0].password_hash);
  if (!valid) throw new HttpError(401, 'E-mail ou senha incorretos');
  const token = createSessionToken();
  await query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1,$2,now() + interval \'7 days\')', [hashSessionToken(token), user.rows[0].id]);
  res.cookie('clinicflow_session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ ok: true });
}));
authRoutes.post('/register', rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-7', legacyHeaders: false }), route(async (req, res) => {
  const { organization, name, email, password } = z.object({
    organization: z.string().trim().min(2).max(100),
    name: z.string().trim().min(2).max(100),
    email: z.string().email().max(254),
    password: z.string().min(10).max(128)
  }).parse(req.body);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query<{id:string}>('INSERT INTO organizations(name) VALUES($1) RETURNING id', [organization]);
    const hashed = await bcrypt.hash(password, 12);
    const user = await client.query<{id:string}>('INSERT INTO users(organization_id,name,email,password_hash,role) VALUES($1,$2,$3,$4,\'admin\') RETURNING id', [org.rows[0].id, name, email.toLowerCase(), hashed]);
    const token = createSessionToken();
    await client.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')', [hashSessionToken(token), user.rows[0].id]);
    await client.query('COMMIT');
    res.cookie('clinicflow_session', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.status(201).json({ok:true});
  } catch (error) {
    await client.query('ROLLBACK');
    if ((error as {code?:string}).code === '23505') throw new HttpError(409, 'Este e-mail já está cadastrado');
    throw error;
  } finally { client.release(); }
}));
authRoutes.post('/logout', route(async (req, res) => {
  const cookie = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('clinicflow_session='));
  const token = cookie?.slice('clinicflow_session='.length);
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
  res.clearCookie('clinicflow_session', cookieOptions);
  res.json({ ok: true });
}));
authRoutes.get('/me', authenticate, route(async (req, res) => {
  const { id, name, role, organization_id, organization_name } = identity(req);
  res.json({ id, name, role, organization_id, organization_name, demo_mode: process.env.WHATSAPP_MODE !== 'live' });
}));
