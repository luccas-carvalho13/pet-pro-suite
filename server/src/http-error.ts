import type { Response } from 'express';
import type { z, ZodTypeAny } from 'zod';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'PLAN_LIMIT'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export function sendError(
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
  field?: string,
) {
  return res.status(status).json({
    error: message,
    code,
    ...(field ? { field } : {}),
  });
}

export function parseWithSchema<T extends ZodTypeAny>(
  res: Response,
  schema: T,
  input: unknown,
): z.infer<T> | null {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path?.[0] != null ? String(issue.path[0]) : undefined;
    sendError(res, 400, 'VALIDATION_ERROR', issue?.message ?? 'Dados inválidos.', field);
    return null;
  }
  return parsed.data;
}
