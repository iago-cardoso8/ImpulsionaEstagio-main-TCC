import { PrismaClient, Vaga } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface CreateVagaInput {
  title: string;
  company: string;
  location: string;
  email: string;
  time?: string;
  type?: string;
  salary: string;
  target: string;
  desc?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface UpdateVagaInput {
  title?: string;
  company?: string;
  location?: string;
  email?: string;
  time?: string;
  type?: string;
  salary?: string;
  target?: string;
  desc?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface VagaResponse {
  id: number;
  title: string;
  company: string;
  location: string;
  email: string;
  time: string;
  type: string;
  salary: string;
  target: string;
  desc: string;
  requirements: string[];
  benefits: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// HELPER: Converter Vaga do Prisma para resposta
// ──────────────────────────────────────────────────────────────

function parseVagaResponse(vaga: Vaga): VagaResponse {
  return {
    ...vaga,
    requirements: JSON.parse(vaga.requirements || '[]'),
    benefits: JSON.parse(vaga.benefits || '[]'),
  };
}

// ──────────────────────────────────────────────────────────────
// OPERAÇÕES CRUD
// ──────────────────────────────────────────────────────────────

/**
 * Buscar todas as vagas
 */
async function findAll(): Promise<VagaResponse[]> {
  const vagas = await prisma.vaga.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return vagas.map(parseVagaResponse);
}

/**
 * Buscar vaga por ID
 */
async function findById(id: number): Promise<VagaResponse | null> {
  const vaga = await prisma.vaga.findUnique({
    where: { id },
  });
  return vaga ? parseVagaResponse(vaga) : null;
}

/**
 * Criar nova vaga
 */
async function create(data: CreateVagaInput): Promise<VagaResponse | null> {
  try {
    const vaga = await prisma.vaga.create({
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        email: data.email,
        time: data.time || 'Agora mesmo',
        type: data.type || 'Estágio',
        salary: data.salary,
        target: data.target,
        desc: data.desc || '',
        requirements: JSON.stringify(data.requirements || []),
        benefits: JSON.stringify(data.benefits || []),
      },
    });
    return parseVagaResponse(vaga);
  } catch (error) {
    console.error('Erro ao criar vaga:', error);
    return null;
  }
}

/**
 * Atualizar vaga
 */
async function update(id: number, data: UpdateVagaInput): Promise<VagaResponse | null> {
  try {
    const vaga = await prisma.vaga.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.time !== undefined && { time: data.time }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.salary !== undefined && { salary: data.salary }),
        ...(data.target !== undefined && { target: data.target }),
        ...(data.desc !== undefined && { desc: data.desc }),
        ...(data.requirements !== undefined && { requirements: JSON.stringify(data.requirements) }),
        ...(data.benefits !== undefined && { benefits: JSON.stringify(data.benefits) }),
      },
    });
    return parseVagaResponse(vaga);
  } catch (error) {
    console.error('Erro ao atualizar vaga:', error);
    return null;
  }
}

/**
 * Deletar vaga
 */
async function remove(id: number): Promise<VagaResponse | null> {
  try {
    const vaga = await prisma.vaga.findUnique({ where: { id } });
    if (!vaga) return null;

    await prisma.vaga.delete({ where: { id } });
    return parseVagaResponse(vaga);
  } catch (error) {
    console.error('Erro ao deletar vaga:', error);
    return null;
  }
}

/**
 * Buscar vagas por target (área)
 */
async function findByTarget(target: string): Promise<VagaResponse[]> {
  const vagas = await prisma.vaga.findMany({
    where: {
      target: {
        contains: target,
        mode: 'insensitive',
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return vagas.map(parseVagaResponse);
}

export { findAll, findById, create, update, remove, findByTarget };
