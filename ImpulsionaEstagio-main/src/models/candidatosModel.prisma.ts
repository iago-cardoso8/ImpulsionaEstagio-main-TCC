import { PrismaClient, Candidato } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface CreateCandidatoInput {
  name: string;
  email: string;
  phone: string;
  location: string;
  resume?: string;
  skills?: string[];
  experience?: string;
}

export interface UpdateCandidatoInput {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  resume?: string;
  skills?: string[];
  experience?: string;
}

export interface CandidatoResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
  resume: string;
  skills: string[];
  experience: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// HELPER
// ──────────────────────────────────────────────────────────────

function parseCandidatoResponse(candidato: Candidato): CandidatoResponse {
  return {
    ...candidato,
    skills: JSON.parse(candidato.skills || '[]'),
  };
}

// ──────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

async function findAll(): Promise<CandidatoResponse[]> {
  const candidatos = await prisma.candidato.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return candidatos.map(parseCandidatoResponse);
}

async function findById(id: number): Promise<CandidatoResponse | null> {
  const candidato = await prisma.candidato.findUnique({
    where: { id },
  });
  return candidato ? parseCandidatoResponse(candidato) : null;
}

async function findByEmail(email: string): Promise<CandidatoResponse | null> {
  const candidato = await prisma.candidato.findUnique({
    where: { email },
  });
  return candidato ? parseCandidatoResponse(candidato) : null;
}

async function create(data: CreateCandidatoInput): Promise<CandidatoResponse | null> {
  try {
    // Verificar se email já existe
    const exists = await prisma.candidato.findUnique({
      where: { email: data.email },
    });

    if (exists) return null;

    const candidato = await prisma.candidato.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        location: data.location,
        resume: data.resume || '',
        skills: JSON.stringify(data.skills || []),
        experience: data.experience || '',
      },
    });
    return parseCandidatoResponse(candidato);
  } catch (error) {
    console.error('Erro ao criar candidato:', error);
    return null;
  }
}

async function update(
  id: number,
  data: UpdateCandidatoInput
): Promise<CandidatoResponse | null> {
  try {
    const candidato = await prisma.candidato.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.resume !== undefined && { resume: data.resume }),
        ...(data.skills !== undefined && { skills: JSON.stringify(data.skills) }),
        ...(data.experience !== undefined && { experience: data.experience }),
      },
    });
    return parseCandidatoResponse(candidato);
  } catch (error) {
    console.error('Erro ao atualizar candidato:', error);
    return null;
  }
}

async function remove(id: number): Promise<CandidatoResponse | null> {
  try {
    const candidato = await prisma.candidato.findUnique({ where: { id } });
    if (!candidato) return null;

    await prisma.candidato.delete({ where: { id } });
    return parseCandidatoResponse(candidato);
  } catch (error) {
    console.error('Erro ao deletar candidato:', error);
    return null;
  }
}

export { findAll, findById, findByEmail, create, update, remove };
