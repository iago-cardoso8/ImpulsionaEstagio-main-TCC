const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  // Titles from prisma/seed.ts
  const seedTitles = [
    'Estágio em Eletrônica',
    'Suporte em Mecânica',
    'Desenvolvedor Front-end Trainee'
  ];
  try {
    console.log('Fetching vagas...');
    const all = await prisma.vaga.findMany({ select: { id: true, title: true, company: true } });
    const toDelete = all.filter(v => !seedTitles.includes(v.title));
    if (toDelete.length === 0) {
      console.log('No non-seed vagas found. Nothing to delete.');
    } else {
      console.log(`Deleting ${toDelete.length} vagas:`);
      for (const v of toDelete) {
        console.log(` - [${v.id}] ${v.title} (${v.company})`);
        await prisma.vaga.delete({ where: { id: v.id } });
      }
      console.log('Deletion complete.');
    }
  } catch (e) {
    console.error('Error cleaning vagas:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
