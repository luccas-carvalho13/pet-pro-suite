import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { logger } from './logger.js';

type Metrics = {
  started_at: string;
  total_requests: number;
  total_errors: number;
  by_status: Record<string, number>;
};

const metrics: Metrics = {
  started_at: new Date().toISOString(),
  total_requests: 0,
  total_errors: 0,
  by_status: {},
};

export function observabilityMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] ? String(req.headers['x-request-id']) : randomUUID();
  const start = Date.now();

  res.setHeader('x-request-id', requestId);
  metrics.total_requests += 1;

  res.on('finish', () => {
    const status = String(res.statusCode);
    metrics.by_status[status] = (metrics.by_status[status] ?? 0) + 1;
    if (res.statusCode >= 500) metrics.total_errors += 1;

    logger.info(`[${requestId}] ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`);
  });

  next();
}

export function getMetricsSnapshot() {
  return {
    ...metrics,
    uptime_seconds: Math.floor(process.uptime()),
    memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  };
}
