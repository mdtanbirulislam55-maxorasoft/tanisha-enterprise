// backend/src/utils/envValidator.js
// Production-safe environment validation (no external deps)

function parseAllowedOrigins(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function validateEnv() {
  const errors = [];

  const required = [
    'NODE_ENV',
    'PORT',
    'DATABASE_URL',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  for (const key of required) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  // Basic safety checks
  if (process.env.NODE_ENV && !['development', 'production', 'test'].includes(process.env.NODE_ENV)) {
    errors.push(`NODE_ENV must be one of: development, production, test (got "${process.env.NODE_ENV}")`);
  }

  // JWT secret sanity
  if (process.env.JWT_ACCESS_SECRET && String(process.env.JWT_ACCESS_SECRET).length < 32) {
    errors.push('JWT_ACCESS_SECRET looks too short (recommend 32+ chars).');
  }
  if (process.env.JWT_REFRESH_SECRET && String(process.env.JWT_REFRESH_SECRET).length < 32) {
    errors.push('JWT_REFRESH_SECRET looks too short (recommend 32+ chars).');
  }

  // Allowed origins sanity (not required, but recommended)
  const origins = parseAllowedOrigins(process.env.ALLOWED_ORIGINS);
  if (origins.length === 0) {
    // Not fatal in dev, but warn in prod
    if (process.env.NODE_ENV === 'production') {
      errors.push('ALLOWED_ORIGINS is empty in production. Set it to your frontend URL(s).');
    }
  }

  // PORT should be number
  if (process.env.PORT && Number.isNaN(Number(process.env.PORT))) {
    errors.push(`PORT must be a number (got "${process.env.PORT}")`);
  }

  if (errors.length) {
    // Print clean and exit hard (prevents half-configured prod servers)
    // eslint-disable-next-line no-console
    console.error('\n❌ Environment validation failed:\n' + errors.map((e) => ` - ${e}`).join('\n') + '\n');
    process.exit(1);
  }

  return true;
}

module.exports = validateEnv;
