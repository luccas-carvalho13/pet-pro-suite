import type { Response } from 'express';
import { pool } from './db.js';
import { sendError } from './http-error.js';

type RawFeatures = Record<string, unknown> | null;

export type PlanContext = {
  planId: string | null;
  planName: string;
  companyStatus: string;
  maxUsers: number | null;
  maxPets: number | null;
  features: Record<string, unknown>;
};

type CompanyPlanRow = {
  plan_id: string | null;
  plan_name: string | null;
  company_status: string;
  max_users: number | null;
  max_pets: number | null;
  features: RawFeatures;
};

function normalizeLimit(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Math.floor(n);
}

function normalizeFeatures(features: RawFeatures): Record<string, unknown> {
  if (!features || typeof features !== 'object' || Array.isArray(features)) return {};
  return features;
}

export async function getPlanContext(companyId: string): Promise<PlanContext | null> {
  const { rows } = await pool.query<CompanyPlanRow>(
    `SELECT
       c.status::text AS company_status,
       p.id AS plan_id,
       p.name AS plan_name,
       p.max_users,
       p.max_pets,
       p.features
     FROM public.companies c
     LEFT JOIN public.plans p ON p.id = c.current_plan_id
     WHERE c.id = $1
     LIMIT 1`,
    [companyId]
  );
  const row = rows[0];
  if (!row) return null;

  const features = normalizeFeatures(row.features);
  const usersFromFeatures = normalizeLimit(features.users);
  const petsFromFeatures = normalizeLimit(features.pets);

  return {
    planId: row.plan_id,
    planName: row.plan_name ?? 'Sem plano',
    companyStatus: row.company_status ?? 'trial',
    maxUsers: normalizeLimit(row.max_users) ?? usersFromFeatures,
    maxPets: normalizeLimit(row.max_pets) ?? petsFromFeatures,
    features,
  };
}

function isModuleEnabled(ctx: PlanContext, moduleKey: string): boolean {
  const value = ctx.features[moduleKey];
  if (value == null) return true;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
  return Boolean(value);
}

export async function assertPlanModuleAccess(
  res: Response,
  companyId: string,
  moduleKey: string,
  moduleLabel: string
): Promise<boolean> {
  const ctx = await getPlanContext(companyId);
  if (!ctx) {
    sendError(res, 403, 'FORBIDDEN', 'Empresa não encontrada para validar plano.');
    return false;
  }
  if (isModuleEnabled(ctx, moduleKey)) return true;

  sendError(
    res,
    403,
    'PLAN_LIMIT',
    `${moduleLabel} não está disponível no plano ${ctx.planName}. Faça upgrade para liberar esse recurso.`
  );
  return false;
}

export async function assertPlanLimit(
  res: Response,
  companyId: string,
  opts: { entity: 'users' | 'pets'; entityLabel: string; table: 'profiles' | 'pets' }
): Promise<boolean> {
  const ctx = await getPlanContext(companyId);
  if (!ctx) {
    sendError(res, 403, 'FORBIDDEN', 'Empresa não encontrada para validar plano.');
    return false;
  }
  const limit = opts.entity === 'users' ? ctx.maxUsers : ctx.maxPets;
  if (limit == null) return true;

  const { rows } = await pool.query<{ c: number }>(
    `SELECT COUNT(*)::int AS c FROM public.${opts.table} WHERE company_id = $1`,
    [companyId]
  );
  const current = Number(rows[0]?.c ?? 0);
  if (current < limit) return true;

  sendError(
    res,
    403,
    'PLAN_LIMIT',
    `Limite do plano ${ctx.planName} atingido: ${limit} ${opts.entityLabel}. Faça upgrade para continuar.`
  );
  return false;
}
