const { PrismaClient } = require('@prisma/client');

if (process.env.NODE_ENV === 'production' || !process.argv.includes('--confirm')) {
  console.error('Limpeza recusada. Execute somente fora de produção e informe --confirm.');
  process.exit(1);
}

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Deleting candidaturas...');
    await prisma.candidatura.deleteMany();
    console.log('Deleting perfis...');
    await prisma.perfil.deleteMany();
    console.log('Deleting usuarios...');
    await prisma.usuario.deleteMany();
    console.log('All test-related records deleted.');
  } catch (e) {
    console.error('Error during cleanup:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
