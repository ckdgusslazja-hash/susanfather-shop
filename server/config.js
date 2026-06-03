const path = require('path');

const PRODUCTION_DOMAIN = 'https://susanfather.com';

function getSiteUrl() {
  const raw = process.env.SITE_URL || process.env.PUBLIC_URL || '';
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return PRODUCTION_DOMAIN;
  const port = process.env.PORT || 3000;
  return `http://localhost:${port}`;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (isProduction && (!secret || secret.length < 32)) {
    console.error('[FATAL] 프로덕션에서는 JWT_SECRET(32자 이상)이 필수입니다.');
    process.exit(1);
  }
  return secret || 'greenharvest-dev-secret-change-in-production';
}

module.exports = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 3000,
  siteUrl: getSiteUrl(),
  siteName: process.env.SITE_NAME || '수산아빠',
  jwtSecret: getJwtSecret(),
  dbPath: process.env.DB_PATH || path.join(__dirname, 'shop.db'),
  trustProxy: process.env.TRUST_PROXY !== '0',
};
