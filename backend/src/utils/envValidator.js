// src/utils/envValidator.js
// Centralized environment validation + normalization for production safety.

const required = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];

/**
 * Validate required env vars.
 * - In production: throws if missing
 * - In development/test: logs warnings but continues
 */
function validateEnv() {
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '');
  if (missing.length === 0) return { ok: true, missing: [] };

  const msg = `Missing required environment variables: ${missing.join(', ')}`;

  if (process.env.NODE_ENV === 'production') {
    const err = new Error(msg);
    err.code = 'ENV_MISSING';
    throw err;
  }

  // eslint-disable-next-line no-console
  console.warn(`⚠️  ${msg}`);
  return { ok: false, missing };
}

/**
 * Optional compatibility layer for older env keys.
 * If legacy keys exist and new keys are absent, map them.
 */
function normalizeLegacyEnv() {
  // Backwards compat (older setups used JWT_SECRET/JWT_EXPIRE)
  if (!process.env.JWT_ACCESS_SECRET && process.env.JWT_SECRET) {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET;
  }
  if (!process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET_LEGACY) {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET_LEGACY;
  }
}

module.exports = { validateEnv, normalizeLegacyEnv };
