import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

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
  const studentEmail = process.env.SEED_STUDENT_EMAIL || 'student.dev@example.com';
  const studentPassword = process.env.SEED_STUDENT_PASSWORD || 'student-dev-only';
  const companyEmail = process.env.SEED_COMPANY_EMAIL || 'company.dev@example.com';
  const companyPassword = process.env.SEED_COMPANY_PASSWORD || 'company-dev-only';
  const [studentPasswordHash, companyPasswordHash] = await Promise.all([
    bcrypt.hash(studentPassword, 12),
    bcrypt.hash(companyPassword, 12),
  ]);

  const student = await prisma.usuario.upsert({
    where: { email: studentEmail },
    update: { name: seedPerfil.name, passwordHash: studentPasswordHash, role: 'student' },
    create: {
      name: seedPerfil.name,
      email: studentEmail,
      passwordHash: studentPasswordHash,
      role: 'student',
    },
  });
  const company = await prisma.usuario.upsert({
    where: { email: companyEmail },
    update: { name: 'Empresa de Desenvolvimento', passwordHash: companyPasswordHash, role: 'company' },
    create: {
      name: 'Empresa de Desenvolvimento',
      email: companyEmail,
      passwordHash: companyPasswordHash,
      role: 'company',
    },
  });

  await prisma.perfil.upsert({
    where: { usuarioId: student.id },
    update: { ...seedPerfil, email: student.email },
    create: { ...seedPerfil, email: student.email, usuarioId: student.id },
  });

  for (const seedVaga of seedVagas) {
    const vaga = { ...seedVaga, company: company.name, email: company.email, usuarioId: company.id };
    const existing = await prisma.vaga.findFirst({
      where: { title: vaga.title, usuarioId: company.id },
    });
    if (existing) {
      await prisma.vaga.update({ where: { id: existing.id }, data: vaga });
    } else {
      await prisma.vaga.create({ data: vaga });
    }
  }

  for (const notificacao of seedNotificacoes) {
    const existing = await prisma.notification.findFirst({
      where: { title: notificacao.title, message: notificacao.message },
    });
    if (!existing) await prisma.notification.create({ data: notificacao });
  }

  console.log('Seed concluído. Contas de desenvolvimento disponíveis conforme as variáveis SEED_* do ambiente.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
