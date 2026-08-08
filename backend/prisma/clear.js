const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Clearing all PrivacyLens Database records except the primary user...');

  await prisma.auditLog.deleteMany();
  await prisma.privacyRequest.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.dataItem.deleteMany();
  await prisma.website.deleteMany();
  await prisma.user.deleteMany();

  // Create primary demo user so the dashboard doesn't 404
  const user = await prisma.user.create({
    data: {
      id: 'usr_12345',
      name: 'Joshua',
      email: 'joshua@example.com',
      passwordHash: 'hashed_demo_password',
      privacyScore: 100
    }
  });

  console.log(`👤 Created Clean Demo User: ${user.name} (${user.email})`);
  console.log('✅ Database cleared and user initialized successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Clearing Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
