import { Router } from 'express';
import { z } from 'zod';
import { query } from '../lib/db.js';
import { identity } from '../lib/auth.js';
import { HttpError, route } from '../lib/http.js';

export const dealsRoutes = Router();
const stages = z.enum(['new', 'qualified', 'proposal', 'won', 'lost']);
const dealInput = z.object({ contact_id: z.string().uuid(), title: z.string().trim().min(2).max(140), value_cents: z.number().int().min(0).max(1000000000), stage: stages.default('new') });
dealsRoutes.get('/', route(async (req, res) => {
  const rows = await query(`SELECT d.*, c.name AS contact_name FROM deals d JOIN contacts c ON c.id=d.contact_id AND c.organization_id=d.organization_id WHERE d.organization_id=$1 ORDER BY d.updated_at DESC LIMIT 300`, [identity(req).organization_id]);
  res.json(rows.rows);
}));
dealsRoutes.post('/', route(async (req, res) => {
  const body = dealInput.parse(req.body);
  const org = identity(req).organization_id;
  const contact = await query('SELECT id FROM contacts WHERE id=$1 AND organization_id=$2 AND archived=FALSE', [body.contact_id, org]);
  if (!contact.rowCount) throw new HttpError(404, 'Contato não encontrado nesta organização');
  const record = await query('INSERT INTO deals (organization_id, contact_id, title, value_cents, stage) VALUES ($1,$2,$3,$4,$5) RETURNING *', [org, body.contact_id, body.title, body.value_cents, body.stage]);
  res.status(201).json(record.rows[0]);
}));
dealsRoutes.patch('/:id', route(async (req, res) => {
  const body = z.object({ stage: stages }).parse(req.body);
  const result = await query('UPDATE deals SET stage=$3, updated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING *', [req.params.id, identity(req).organization_id, body.stage]);
  if (!result.rowCount) throw new HttpError(404, 'Oportunidade não encontrada');
  res.json(result.rows[0]);
}));
