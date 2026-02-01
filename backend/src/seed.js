// backend/src/seed.js
const prisma = require('./lib/prisma');

async function main() {
  console.log('🌱 Seed is disabled (SEED: B).');
  console.log('✅ No demo data, no default users, no credentials created.');
  console.log('ℹ️ Create users via Admin panel or by calling /api/auth/register (if enabled by you).');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
