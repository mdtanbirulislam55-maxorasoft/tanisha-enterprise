/* eslint-disable no-console */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function setupDatabase() {
  console.log('Setting up database...');

  try {
    // Ensure main branch
    const mainBranch = await prisma.branch.upsert({
      where: { id: 1 },
      update: {
        code: 'MAIN',
        name: 'Main Branch',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1234-567891',
        isActive: true,
      },
      create: {
        id: 1,
        code: 'MAIN',
        name: 'Main Branch',
        address: 'Dhaka, Bangladesh',
        phone: '+880 1234-567891',
        isActive: true,
      },
    });

    // Create admin user
    const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
    const hashedPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'password123', rounds);

    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@tanisha.com' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin@tanisha.com',
        password: hashedPassword,
        fullName: 'Administrator',
        role: 'admin',
        designation: 'System Admin',
        branchId: mainBranch.id,
        isActive: true,
        emailVerified: true,
        profileImage: 'default-avatar.png',
      },
    });

    console.log('✅ Admin user ready:', adminUser.email);
    console.log('✅ Main branch ready:', mainBranch.name);

    console.log('\n✅ Setup completed successfully!');
    console.log('Login with:');
    console.log('📧 Email: admin@tanisha.com');
    console.log('🔑 Password:', process.env.SEED_ADMIN_PASSWORD || 'password123');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();
