const PRODUCTION_SITE_URL = 'https://susanfather.com';

function stripEnv(value: string): string {
  return value.replace(/^\uFEFF+/g, '').trim();
}

export function getSiteUrl(): string {
  const raw = stripEnv(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || '');
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return PRODUCTION_SITE_URL;
  const port = process.env.PORT || '3000';
  return `http://localhost:${port}`;
}

export const siteUrl = getSiteUrl();
export const siteName = process.env.SITE_NAME || '수산아빠';
export const nodeEnv = process.env.NODE_ENV || 'development';
export const isProduction = nodeEnv === 'production';

export function getJwtSecret(): string {
  const secret = stripEnv(process.env.JWT_SECRET || '');
  if (secret && secret.length >= 32) return secret;
  if (isProduction && process.env.VERCEL) {
    return secret || 'set-jwt-secret-in-vercel-env-min-32-chars!!';
  }
  return secret || 'greenharvest-dev-secret-change-in-production';
}

export const jwtSecret = getJwtSecret();
