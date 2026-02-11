import { pool } from './db.js';
import { logger } from './logger.js';

type AuditAction =
  | 'company.created'
  | 'company.updated'
  | 'plan.updated'
  | 'user.invited'
  | 'user.role.updated';

type AuditParams = {
  actor_user_id?: string | null;
  company_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditLog({
  actor_user_id,
  company_id,
  ip_address,
  user_agent,
  action,
  entity_type,
  entity_id,
  metadata,
}: AuditParams): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO public.audit_logs
       (actor_user_id, company_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        actor_user_id ?? null,
        company_id ?? null,
        action,
        entity_type,
        entity_id ?? null,
        ip_address ?? null,
        user_agent ?? null,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
  } catch (error) {
    logger.errorFull('[audit] falha ao gravar log de auditoria', error);
  }
}
