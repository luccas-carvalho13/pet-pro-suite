import type { Request, Response, NextFunction } from 'express';
import { loginRateLimitMax, loginRateLimitWindowMs } from './config.js';

type Entry = { count: number; resetAt: number };
const attempts = new Map<string, Entry>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  }
  return req.ip ?? 'unknown';
}

export function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const ip = getClientIp(req) || 'unknown';
  const entry = attempts.get(ip);

  if (!entry || now >= entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + loginRateLimitWindowMs });
    return next();
  }

  if (entry.count >= loginRateLimitMax) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
    });
  }

  entry.count += 1;
  attempts.set(ip, entry);
  return next();
}

export function resetLoginRateLimit() {
  attempts.clear();
}
