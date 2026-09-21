import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// Dados de seed para vagas
const seedVagas = [
  {
    title: 'Estágio em Eletrônica',
    company: 'AEC / IFPB Parceiros',
    location: 'João Pessoa - PB',
    email: 'contato@aec-ifpb.com',
    time: 'Há 5 horas',
    type: 'Estágio',
    salary: 'R$ 800,00',
    target: 'Eletrotécnica',
    desc: 'Manutenção e testes de componentes eletrônicos.',
    requirements: JSON.stringify(['Eletricidade Básica', 'Matrícula ativa']),
    benefits: JSON.stringify(['Bolsa Auxílio', 'VT']),
  },
  {
    title: 'Suporte em Mecânica',
    company: 'Indústria MetalPB',
    location: 'Cabedelo - PB',
    email: 'rh@metalpb.com',
    time: 'Há 2 dias',
    type: 'Estágio',
    salary: 'R$ 950,00',
    target: 'Mecânica',
    desc: 'Auxílio na manutenção preventiva de tornos CNC.',
    requirements: JSON.stringify(['Desenho técnico', 'Proatividade']),
    benefits: JSON.stringify(['Refeitório', 'Transporte']),
  },
  {
    title: 'Desenvolvedor Front-end Trainee',
    company: 'AEC / Tech',
    location: 'Campina Grande - PB',
    email: 'contato@aec-tech.com',
    time: 'Há 10 horas',
    type: 'Estágio',
    salary: 'R$ 1200,00',
    target: 'Informática',
    desc: 'Criação de interfaces web usando HTML, CSS e JS.',
    requirements: JSON.stringify(['Lógica de Programação', 'Vontade de aprender']),
    benefits: JSON.stringify(['Home Office parcial']),
  },
];

// Dados de seed para perfil
const seedPerfil = {
  name: 'Ana Silva',
  email: 'ana.silva@ifpb.edu.br',
  course: 'Informática',
  campus: 'João Pessoa',
  status: 'Em busca de estágio',
  availability: 'Período Integral',
};

// Dados de seed para notificações
const seedNotificacoes = [
  {
    title: 'Nova vaga recomendada',
    message: 'Uma oportunidade em Informática acaba de ser publicada.',
    time: 'Há 1 hora',
  },
  {
    title: 'Recado do campus',
    message: 'Atualize seu perfil para receber vagas mais relevantes.',
    time: 'Ontem',
  },
  {
    title: 'Alerta de inscrição',
    message: 'Prazo final para inscrição em vaga de Mecânica: amanhã.',
    time: 'Há 2 dias',
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // Seed de vagas
  const vagasCount = await prisma.vaga.count();
  if (vagasCount === 0) {
    for (const vaga of seedVagas) {
      await prisma.vaga.create({
        data: vaga,
      });
    }
    console.log(`✅ ${seedVagas.length} vagas inseridas.`);
  } else {
    console.log(`⚠️  Vagas já existem (${vagasCount} registros). Pulando seed.`);
  }

  // Seed de perfil
  const perfilCount = await prisma.perfil.count();
  if (perfilCount === 0) {
    await prisma.perfil.create({
      data: seedPerfil,
    });
    console.log('✅ Perfil inicial inserido.');
  } else {
    console.log(`⚠️  Perfil já existe (${perfilCount} registros). Pulando seed.`);
  }

  // Seed de notificações
  const notificacoesCount = await prisma.notification.count();
  if (notificacoesCount === 0) {
    for (const notificacao of seedNotificacoes) {
      await prisma.notification.create({
        data: notificacao,
      });
    }
    console.log(`✅ ${seedNotificacoes.length} notificações inseridas.`);
  } else {
    console.log(`⚠️  Notificações já existem (${notificacoesCount} registros). Pulando seed.`);
  }

  console.log('\n✨ Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
