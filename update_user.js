const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.user.updateMany({
    where: { email: 'admin@pup.edu.ph' },
    data: { name: 'Alex Morgan / Event Director', email: 'admin@eventcert.com' }
  });
  console.log("Updated user");
}

run().finally(() => prisma.$disconnect());
