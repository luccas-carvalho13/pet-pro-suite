const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET && isProduction) {
  throw new Error('JWT_SECRET é obrigatório em produção.');
}

// Em desenvolvimento/teste usamos fallback local; em produção é obrigatório via env.
export const jwtSecret = process.env.JWT_SECRET ?? 'petpro-dev-secret-change-in-production';

export const loginRateLimitMax = Number(process.env.LOGIN_RATE_LIMIT_MAX ?? 10);
export const loginRateLimitWindowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
