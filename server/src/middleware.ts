/**
 * Multi-tenant: req.companyId vem SEMPRE de public.profiles.company_id do usuário autenticado.
 * Todas as rotas de dados devem filtrar por company_id = req.companyId. Nunca vazar dados de outra empresa.
 */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { jwtSecret } from './config.js';

export type AuthReq = Request & { userId?: string; companyId?: string | null; isSuperAdmin?: boolean; isAdmin?: boolean };

export async function requireAuth(req: AuthReq, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Token ausente.' });
      return;
    }
    const decoded = jwt.verify(token, jwtSecret) as { sub: string };
    req.userId = decoded.sub;
    // Única fonte de verdade para tenant: profile.company_id
    const { rows } = await pool.query(
      `SELECT company_id FROM public.profiles WHERE id = $1`,
      [req.userId]
    );
    req.companyId = rows[0]?.company_id ?? null;
    const superadmin = await pool.query(
      `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'superadmin' LIMIT 1`,
      [req.userId]
    );
    req.isSuperAdmin = superadmin.rows.length > 0;
    let adminRoleRows = 0;
    if (req.companyId) {
      const adminRole = await pool.query(
        `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND company_id = $2 AND role IN ('admin', 'superadmin') LIMIT 1`,
        [req.userId, req.companyId]
      );
      adminRoleRows = adminRole.rows.length;
    }
    req.isAdmin = !!req.isSuperAdmin || adminRoleRows > 0;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

/** Exige que o usuário tenha empresa (profile.company_id). Superadmin pode não ter. */
export async function requireCompany(req: AuthReq, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  if (req.isSuperAdmin) return next();
  if (!req.companyId) {
    res.status(403).json({
      error: 'Usuário não está vinculado a nenhuma empresa. Entre em contato com o suporte.',
    });
    return;
  }
  next();
}

export async function requireAdmin(req: AuthReq, res: Response, next: NextFunction) {
  if (!req.userId) {
    res.status(401).json({ error: 'Não autenticado.' });
    return;
  }
  if (!req.isAdmin) {
    res.status(403).json({ error: 'Acesso restrito a administradores.' });
    return;
  }
  if (!req.companyId && !req.isSuperAdmin) {
    res.status(403).json({ error: 'Você precisa estar vinculado a uma empresa para convidar.' });
    return;
  }
  next();
}
