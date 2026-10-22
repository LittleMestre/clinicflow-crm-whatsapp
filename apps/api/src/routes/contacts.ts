import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { identity } from '../lib/auth.js';
import { HttpError, route } from '../lib/http.js';
import { normalizePhone } from '../lib/whatsapp.js';

export const contactsRoutes = Router();
const contactInput = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().min(8).max(30), email: z.union([z.literal(''), z.string().email()]).default(''), tags: z.array(z.string().trim().min(1).max(30)).max(8).default([]), opted_in: z.boolean().default(false) });
contactsRoutes.get('/', route(async (req, res) => {
  const org = identity(req).organization_id;
  const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
  const result = await query(`SELECT id, name, phone, email, tags, opted_in, created_at FROM contacts
      WHERE organization_id = $1 AND archived = FALSE AND (name ILIKE $2 OR phone ILIKE $2 OR email ILIKE $2)
      ORDER BY created_at DESC LIMIT 200`, [org, `%${search}%`]);
  res.json(result.rows);
}));
contactsRoutes.post('/', route(async (req, res) => {
  const body = contactInput.parse(req.body);
  const phone = normalizePhone(body.phone);
  if (phone.length < 10 || phone.length > 15) throw new HttpError(400, 'Informe o telefone com DDI, somente dígitos (10 a 15)');
  const org = identity(req).organization_id;
  try {
    const result = await query('INSERT INTO contacts (organization_id, name, phone, email, tags, opted_in) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *', [org, body.name, phone, body.email, body.tags, body.opted_in]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new HttpError(409, 'Este telefone já está cadastrado nesta organização');
    throw error;
  }
}));
contactsRoutes.patch('/:id', route(async (req, res) => {
  const fields = contactInput.partial().extend({ archived: z.boolean().optional() }).parse(req.body);
  const org = identity(req).organization_id;
  const existing = await query('SELECT * FROM contacts WHERE id=$1 AND organization_id=$2', [req.params.id, org]);
  if (!existing.rowCount) throw new HttpError(404, 'Contato não encontrado');
  const merged = { ...existing.rows[0], ...fields };
  const phone = normalizePhone(merged.phone);
  if (phone.length < 10 || phone.length > 15) throw new HttpError(400, 'Telefone inválido');
  try {
    const result = await query(`UPDATE contacts SET name=$3, phone=$4, email=$5, tags=$6, opted_in=$7, archived=$8 WHERE id=$1 AND organization_id=$2 RETURNING *`,
      [req.params.id, org, merged.name, phone, merged.email, merged.tags, merged.opted_in, merged.archived]);
    res.json(result.rows[0]);
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new HttpError(409, 'Telefone já cadastrado');
    throw error;
  }
}));
