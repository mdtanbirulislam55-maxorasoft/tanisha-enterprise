// Centralized environment validation & helpers
// Keeps the app from starting with misconfigured production env.

const required = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
];

const optionalWithDefaults = {
  PORT: '5000',
  NODE_ENV: 'development',
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '30d',
  CORS_ORIGINS: '', // comma-separated origins
  TRUST_PROXY: 'false',
  ALLOW_DB_RESTORE: 'false',
};

function normalizeEnv() {
  // Apply defaults for optional vars
  for (const [key, value] of Object.entries(optionalWithDefaults)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }

  // Backward compatibility: if old JWT names exist, map them.
  // (Prefer new names if already set.)
  if (!process.env.JWT_ACCESS_SECRET && process.env.JWT_SECRET) {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET;
  }
  if (!process.env.JWT_ACCESS_EXPIRES_IN && process.env.JWT_EXPIRE) {
    process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_EXPIRE;
  }
  // Some projects used JWT_ACCESS_EXPIRE (without the "S"); support it too.
  if (!process.env.JWT_ACCESS_EXPIRES_IN && process.env.JWT_ACCESS_EXPIRE) {
    process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRE;
  }
  if (!process.env.JWT_REFRESH_EXPIRES_IN && process.env.JWT_REFRESH_EXPIRE) {
    process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRE;
  }

  // CORS: support ALLOWED_ORIGINS (common naming) as alias for CORS_ORIGINS
  if ((!process.env.CORS_ORIGINS || process.env.CORS_ORIGINS === '') && process.env.ALLOWED_ORIGINS) {
    process.env.CORS_ORIGINS = process.env.ALLOWED_ORIGINS;
  }
}

function validateEnv() {
  normalizeEnv();

  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    // eslint-disable-next-line no-console
    console.error(`\n[ENV] ${msg}\n`);
    throw new Error(msg);
  }

  return true;
}

module.exports = {
  validateEnv,
};
