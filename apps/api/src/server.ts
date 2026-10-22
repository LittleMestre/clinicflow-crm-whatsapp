import 'dotenv/config';
import express from 'express';
import { authRoutes } from './routes/auth.js';
import { contactsRoutes } from './routes/contacts.js';
import { dealsRoutes } from './routes/deals.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { conversationRoutes } from './routes/conversations.js';
import { whatsappRoutes } from './routes/whatsapp.js';
import { settingsRoutes } from './routes/settings.js';
import { authenticate } from './lib/auth.js';
import { errorHandler } from './lib/http.js';
import { pool } from './lib/db.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.path.startsWith('/api/webhooks/')) {
    const origin = req.header('origin');
    // API is intended to be reverse-proxied under the same domain as the frontend.
    const permitted = [process.env.WEB_ORIGIN || 'http://localhost:5173', `http://localhost:${process.env.PORT || 4000}`];
    if (origin && !permitted.includes(origin)) return res.status(403).json({ error: 'Origem não permitida' });
  }
  next();
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'clinicflow-api' }));
// Raw bytes must be preserved for Meta's HMAC signature verification.
app.use('/api/webhooks/whatsapp', express.raw({ type: 'application/json', limit: '512kb' }), whatsappRoutes);
app.use(express.json({ limit: '128kb' }));
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/contacts', authenticate, contactsRoutes);
app.use('/api/deals', authenticate, dealsRoutes);
app.use('/api/conversations', authenticate, conversationRoutes);
app.use('/api/settings', authenticate, settingsRoutes);
app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada' }));
app.use(errorHandler);
const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`ClinicFlow API disponível em http://localhost:${port}`));
const shutdown = () => server.close(() => { void pool.end().finally(() => process.exit(0)); });
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
