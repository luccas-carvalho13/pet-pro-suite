import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';
import { logger } from './logger.js';
import { jwtSecret } from './config.js';
import { parseWithSchema, sendError } from './http-error.js';
import { changePasswordSchema, emailSchema, inviteSchema, loginSchema, registerSchema } from './validation.js';
import { writeAuditLog } from './audit.js';
import { assertPlanLimit } from './plan-access.js';

function createToken(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' });
}

function normalizeDigits(value?: string | null): string {
  return (value ?? '').replace(/\D/g, '');
}

export async function login(req: Request, res: Response) {
  try {
    const parsed = parseWithSchema(res, loginSchema, req.body);
    if (!parsed) return;
    const { email, password } = parsed;

    const emailNorm = email.trim().toLowerCase();
    const { rows } = await pool.query(
      `SELECT id, email, raw_user_meta_data, encrypted_password FROM auth.users WHERE LOWER(email) = $1`,
      [emailNorm]
    );

    if (rows.length === 0) {
      logger.info('[login] 401: usuário não encontrado', { email: emailNorm });
      sendError(res, 401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.');
      return;
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.encrypted_password ?? '');
    if (!ok) {
      logger.info('[login] 401: senha incorreta', { email: emailNorm });
      sendError(res, 401, 'UNAUTHORIZED', 'E-mail ou senha incorretos.');
      return;
    }

    const token = createToken(user.id);
    let company: { id: string; name: string } | null = null;
    const prof = await pool.query('SELECT company_id FROM public.profiles WHERE id = $1', [user.id]);
    if (prof.rows[0]?.company_id) {
      const co = await pool.query('SELECT id, name FROM public.companies WHERE id = $1', [prof.rows[0].company_id]);
      if (co.rows[0]) company = { id: co.rows[0].id, name: co.rows[0].name };
    }
    logger.info('[login] 200: login ok', { email: user.email, companyId: company?.id ?? null });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.raw_user_meta_data?.full_name ?? '',
      },
      company,
    });
  } catch (e) {
    logger.errorFull('[login] 500: erro ao fazer login', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao fazer login.');
  }
}

export async function checkEmail(req: Request, res: Response) {
  try {
    const parsedEmail = emailSchema.safeParse((req.query.email as string | undefined)?.trim()?.toLowerCase());
    if (!parsedEmail.success) return sendError(res, 400, 'VALIDATION_ERROR', 'E-mail é obrigatório.', 'email');
    const email = parsedEmail.data;
    const { rows } = await pool.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      [email]
    );
    res.json({ available: rows.length === 0 });
  } catch (e) {
    logger.errorFull('[checkEmail] 500', e);
    res.status(500).json({ available: false });
  }
}

export async function register(req: Request, res: Response) {
  const parsed = parseWithSchema(res, registerSchema, req.body);
  if (!parsed) return;
  const body = parsed;
  logger.info('[register] body', {
    email: body?.email,
    full_name: body?.full_name,
    company_name: body?.company_name,
    passwordLength: body?.password ? String(body.password).length : 0,
  });

  try {
    const { email, password, full_name, user_phone, company_name, company_cnpj, company_phone, company_address } = body;
    const fullName = full_name.trim();
    const companyName = company_name.trim();
    const emailNorm = email.trim().toLowerCase();
    const userPhoneDigits = normalizeDigits(user_phone);
    const companyPhoneDigits = normalizeDigits(company_phone);
    const cnpjDigits = normalizeDigits(company_cnpj);
    const address = company_address?.trim() || null;
    const userPhoneOk = userPhoneDigits.length >= 10 && userPhoneDigits.length <= 13;
    const companyPhoneOk = companyPhoneDigits.length >= 10 && companyPhoneDigits.length <= 13;
    if (!userPhoneOk) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Telefone do responsável inválido.', 'user_phone');
      return;
    }
    if (!companyPhoneOk) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Telefone da empresa inválido.', 'company_phone');
      return;
    }
    if (company_cnpj && cnpjDigits.length !== 14) {
      sendError(res, 400, 'VALIDATION_ERROR', 'CNPJ inválido.', 'company_cnpj');
      return;
    }

    const now = Date.now();
    let trialPlanId: string | null = null;
    let trialDays = 14;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      logger.info('[register] verificando e-mail existente', { emailNorm });
      const { rows: existing } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [emailNorm]);
      if (existing.length > 0) {
        logger.info('[register] 409: e-mail já em uso');
        await client.query('ROLLBACK');
        sendError(res, 409, 'CONFLICT', 'Este e-mail já está em uso.', 'email');
        return;
      }

      if (cnpjDigits) {
        const { rows: existingCnpj } = await client.query(
          `SELECT id FROM public.companies
           WHERE REGEXP_REPLACE(COALESCE(cnpj, ''), '[^0-9]', '', 'g') = $1
           LIMIT 1`,
          [cnpjDigits]
        );
        if (existingCnpj.length > 0) {
          logger.info('[register] 409: CNPJ já em uso');
          await client.query('ROLLBACK');
          sendError(res, 409, 'CONFLICT', 'Este CNPJ já está em uso.', 'company_cnpj');
          return;
        }
      }

      const trialPlan = await client.query(
        `SELECT id, trial_days
         FROM public.plans
         WHERE is_active = true AND LOWER(name) = 'trial'
         ORDER BY trial_days DESC
         LIMIT 1`
      );
      if (trialPlan.rows[0]?.id) {
        trialPlanId = trialPlan.rows[0].id as string;
        trialDays = Number(trialPlan.rows[0].trial_days ?? 14);
      }

      logger.info('[register] criando empresa');
      const { rows: companyRows } = await client.query(
        `INSERT INTO public.companies (name, cnpj, phone, address, status, current_plan_id, trial_ends_at)
         VALUES ($1, $2, $3, $4, 'trial', $5, $6)
         RETURNING id, name`,
        [
          companyName,
          cnpjDigits || null,
          companyPhoneDigits || null,
          address,
          trialPlanId,
          new Date(now + Math.max(0, trialDays) * 864e5).toISOString(),
        ]
      );
      const company = companyRows[0];
      if (!company) {
        logger.info('[register] 500: falha ao criar empresa');
        await client.query('ROLLBACK');
        sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar empresa.');
        return;
      }

      logger.info('[register] gerando hash da senha');
      const hash = await bcrypt.hash(password, 10);
      logger.info('[register] inserindo em auth.users');
      const { rows } = await client.query(
        `INSERT INTO auth.users (email, raw_user_meta_data, encrypted_password)
         VALUES ($1, $2, $3)
         RETURNING id, email, raw_user_meta_data`,
        [emailNorm, JSON.stringify({ full_name: fullName, phone: userPhoneDigits }), hash]
      );

      const user = rows[0];
      const emailVal = user.email ?? emailNorm;
      logger.info('[register] vinculando perfil à empresa', { userId: user.id, companyId: company.id });
      await client.query(
        `INSERT INTO public.profiles (id, full_name, email, company_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           company_id = EXCLUDED.company_id,
           full_name = EXCLUDED.full_name,
           email = EXCLUDED.email`,
        [user.id, fullName, emailVal, company.id]
      );
      logger.info('[register] criando role admin');
      await client.query(
        `INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, 'admin', $2)
         ON CONFLICT (user_id, role, company_id) DO NOTHING`,
        [user.id, company.id]
      );
      await writeAuditLog({
        actor_user_id: user.id,
        company_id: company.id,
        ip_address: req.ip ?? null,
        user_agent: req.headers['user-agent'] ?? null,
        action: 'company.created',
        entity_type: 'company',
        entity_id: company.id,
        metadata: { created_by: 'self_register', email: emailNorm },
      });

      await client.query('COMMIT');

      const token = createToken(user.id);
      logger.info('[register] 201: empresa e usuário criados', {
        userId: user.id,
        companyId: company.id,
      });
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.raw_user_meta_data?.full_name ?? '',
        },
        company: { id: company.id, name: company.name },
      });
    } catch (e: unknown) {
      await client.query('ROLLBACK');
      const err = e as { code?: string };
      if (err?.code === '23505') {
        logger.info('[register] 409: conflito de dados');
        sendError(res, 409, 'CONFLICT', 'E-mail ou CNPJ já em uso.');
        return;
      }
      logger.errorFull('[register] 500: erro ao criar conta', e);
      sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar conta.');
    } finally {
      client.release();
    }
  } catch (e) {
    logger.errorFull('[register] 500: erro ao criar conta', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao criar conta.');
  }
}

export async function me(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      res.status(401).json({ error: 'Token ausente.' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { sub: string };
    const userId = decoded.sub;

    const { rows } = await pool.query(
      `SELECT id, email, raw_user_meta_data FROM auth.users WHERE id = $1`,
      [userId]
    );
    if (rows.length === 0) {
      res.status(401).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const user = rows[0];
    let company: { id: string; name: string } | null = null;
    let isAdmin = false;
    let isSuperAdmin = false;
    const prof = await pool.query('SELECT company_id FROM public.profiles WHERE id = $1', [user.id]);
    if (prof.rows[0]?.company_id) {
      const co = await pool.query('SELECT id, name FROM public.companies WHERE id = $1', [prof.rows[0].company_id]);
      if (co.rows[0]) company = { id: co.rows[0].id, name: co.rows[0].name };
      const adminCheck = await pool.query(
        `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND company_id = $2 AND role IN ('admin', 'superadmin') LIMIT 1`,
        [user.id, prof.rows[0].company_id]
      );
      isAdmin = adminCheck.rows.length > 0;
    }
    const superadmin = await pool.query(
      `SELECT 1 FROM public.user_roles WHERE user_id = $1 AND role = 'superadmin' LIMIT 1`,
      [user.id]
    );
    isSuperAdmin = superadmin.rows.length > 0;
    isAdmin = isAdmin || isSuperAdmin;
    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: (user.raw_user_meta_data as { full_name?: string } | null)?.full_name ?? '',
      },
      company,
      is_admin: isAdmin,
      is_superadmin: isSuperAdmin,
    });
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export async function changePassword(req: Request & { userId?: string }, res: Response) {
  try {
    const userId = (req as { userId?: string }).userId;
    if (!userId) {
      return sendError(res, 401, 'UNAUTHORIZED', 'Não autenticado.');
    }
    const parsed = parseWithSchema(res, changePasswordSchema, req.body);
    if (!parsed) return;
    const { current_password, new_password } = parsed;
    const { rows } = await pool.query(
      `SELECT id, encrypted_password FROM auth.users WHERE id = $1`,
      [userId]
    );
    if (!rows[0]) return sendError(res, 401, 'UNAUTHORIZED', 'Usuário não encontrado.');
    const ok = await bcrypt.compare(current_password, rows[0].encrypted_password ?? '');
    if (!ok) return sendError(res, 401, 'UNAUTHORIZED', 'Senha atual incorreta.');
    const hash = await bcrypt.hash(new_password, 10);
    await pool.query(`UPDATE auth.users SET encrypted_password = $1 WHERE id = $2`, [hash, userId]);
    res.json({ ok: true });
  } catch (e) {
    logger.errorFull('[changePassword] 500: erro ao alterar senha', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao alterar senha.');
  }
}

export type InviteBody = { full_name?: string; email?: string; phone?: string; password?: string };

export async function invite(req: Request & { userId?: string; companyId?: string | null }, res: Response) {
  const parsed = parseWithSchema(res, inviteSchema, req.body);
  if (!parsed) return;
  const body = parsed;
  const { full_name, email, phone, password } = body;
  const companyId = req.companyId;

  if (!companyId) {
    sendError(res, 403, 'FORBIDDEN', 'Você precisa estar vinculado a uma empresa para convidar.');
    return;
  }

  const emailNorm = email.trim().toLowerCase();
  try {
    const planLimitOk = await assertPlanLimit(res, companyId, {
      entity: 'users',
      entityLabel: 'usuários',
      table: 'profiles',
    });
    if (!planLimitOk) return;

    const { rows: existing } = await pool.query(`SELECT id FROM auth.users WHERE email = $1`, [emailNorm]);
    if (existing.length > 0) {
      sendError(res, 409, 'CONFLICT', 'Este e-mail já está em uso.', 'email');
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO auth.users (email, raw_user_meta_data, encrypted_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, raw_user_meta_data`,
      [emailNorm, JSON.stringify({ full_name: full_name?.trim() ?? '', phone: phone?.trim() ?? '' }), hash]
    );
    const user = rows[0];
    const fullNameVal = full_name?.trim() ?? '';
    const emailVal = user.email ?? emailNorm;
    await pool.query(
      `INSERT INTO public.profiles (id, full_name, email, company_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET
         company_id = EXCLUDED.company_id,
         full_name = EXCLUDED.full_name,
         email = EXCLUDED.email`,
      [user.id, fullNameVal, emailVal, companyId]
    );
    await pool.query(
      `INSERT INTO public.user_roles (user_id, role, company_id) VALUES ($1, 'usuario', $2)
       ON CONFLICT (user_id, role, company_id) DO NOTHING`,
      [user.id, companyId]
    );
    await writeAuditLog({
      actor_user_id: req.userId ?? null,
      company_id: companyId,
      ip_address: req.ip ?? null,
      user_agent: req.headers['user-agent'] ?? null,
      action: 'user.invited',
      entity_type: 'user',
      entity_id: user.id,
      metadata: { invited_email: user.email, invited_role: 'usuario' },
    });
    logger.info('[invite] usuário convidado', { userId: user.id, companyId });
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        full_name: (user.raw_user_meta_data as { full_name?: string } | null)?.full_name ?? '',
      },
    });
  } catch (e) {
    logger.errorFull('[invite] 500: erro ao convidar', e);
    sendError(res, 500, 'INTERNAL_ERROR', 'Erro ao convidar usuário.');
  }
}
