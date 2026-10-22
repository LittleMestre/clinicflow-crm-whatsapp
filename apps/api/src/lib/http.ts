import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export const route = (fn: (req: Request, res: Response) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res)).catch(next);
};
export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Dados inválidos' });
  if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
  if (process.env.NODE_ENV !== 'production') console.error(error);
  return res.status(500).json({ error: 'Erro interno. Tente novamente.' });
}
