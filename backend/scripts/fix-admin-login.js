/* backend/scripts/fix-admin-login.js */
const bcrypt = require('bcryptjs');
const prisma = require('../src/lib/prisma');

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@tanisha.com').toLowerCase();
  const username = process.env.ADMIN_USERNAME || 'admin';
  const fullName = process.env.ADMIN_FULLNAME || 'Administrator';
  const rawPassword = process.env.ADMIN_PASSWORD || 'password123';
  const role = (process.env.ADMIN_ROLE || 'ADMIN').toUpperCase();

  const hashed = await bcrypt.hash(rawPassword, Number(process.env.BCRYPT_SALT_ROUNDS || 10));

  // ensure at least one branch exists
  let branch = await prisma.branch.findFirst({ select: { id: true } });
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        name: 'Main Branch',
        code: 'MAIN',
        address: 'N/A',
        phone: 'N/A',
        email: 'branch@example.com',
      },
      select: { id: true },
    });
  }

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      username,
      fullName,
      password: hashed,
      role,
      isActive: true,
      emailVerified: true,
      branchId: branch.id,
    },
    create: {
      username,
      email,
      fullName,
      password: hashed,
      role,
      isActive: true,
      emailVerified: true,
      branchId: branch.id,
    },
    select: { id: true, email: true, username: true, role: true, isActive: true, branchId: true },
  });

  console.log('✅ Admin user ready:', user);
  console.log('✅ Login with:', { email, password: rawPassword });
}

main()
  .catch((e) => {
    console.error('❌ fix-admin-login failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
