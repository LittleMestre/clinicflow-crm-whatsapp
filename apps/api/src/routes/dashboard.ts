import { Router } from 'express';
import { query } from '../lib/db.js';
import { identity } from '../lib/auth.js';
import { route } from '../lib/http.js';

export const dashboardRoutes = Router();
dashboardRoutes.get('/', route(async (req, res) => {
  const org = identity(req).organization_id;
  const [summary, stages, recent, trend] = await Promise.all([
    query(`SELECT (SELECT count(*)::int FROM contacts WHERE organization_id=$1 AND NOT archived) AS contacts,
      (SELECT count(*)::int FROM deals WHERE organization_id=$1 AND stage NOT IN ('won','lost')) AS open_deals,
      (SELECT coalesce(sum(value_cents),0)::bigint FROM deals WHERE organization_id=$1 AND stage='won') AS won_cents,
      (SELECT count(*)::int FROM messages WHERE organization_id=$1 AND direction='inbound' AND NOT is_read) AS unread`, [org]),
    query('SELECT stage, count(*)::int AS count FROM deals WHERE organization_id=$1 GROUP BY stage', [org]),
    query(`SELECT m.id, m.body, m.direction, m.status, m.created_at, c.name AS contact_name FROM messages m JOIN contacts c ON c.id=m.contact_id WHERE m.organization_id=$1 ORDER BY m.created_at DESC LIMIT 5`, [org]),
    query(`SELECT to_char(months.month, 'Mon') AS month, coalesce(count(d.id),0)::int AS count
      FROM generate_series(date_trunc('month',now())-interval '5 months', date_trunc('month',now()), interval '1 month') months(month)
      LEFT JOIN deals d ON d.organization_id=$1 AND date_trunc('month', d.created_at)=months.month
      GROUP BY months.month ORDER BY months.month`, [org])
  ]);
  res.json({ ...summary.rows[0], stages: stages.rows, recent: recent.rows, trend: trend.rows });
}));
