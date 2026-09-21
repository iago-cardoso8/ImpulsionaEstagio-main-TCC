import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface CreateCandidaturaInput {
  vagaId: number;
  candidatoId: number;
  status?: string;
  coverLetter?: string;
}

export interface UpdateCandidaturaInput {
  status?: string;
  coverLetter?: string;
}

export interface CandidaturaResponse {
  id: number;
  vagaId: number;
  candidatoId: number;
  status: string;
  coverLetter: string;
  appliedAt: Date;
  updatedAt: Date;
  vaga?: any;
  candidato?: any;
}

// ──────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

async function findAll(includeRelations = false): Promise<CandidaturaResponse[]> {
  const candidaturas = await prisma.candidatura.findMany({
    include: includeRelations ? { vaga: true, candidato: true } : undefined,
    orderBy: { appliedAt: 'desc' },
  });
  return candidaturas;
}

async function findById(id: number, includeRelations = false): Promise<CandidaturaResponse | null> {
  const candidatura = await prisma.candidatura.findUnique({
    where: { id },
    include: includeRelations ? { vaga: true, candidato: true } : undefined,
  });
  return candidatura;
}

async function findByVagaId(vagaId: number, includeRelations = false): Promise<CandidaturaResponse[]> {
  return await prisma.candidatura.findMany({
    where: { vagaId },
    include: includeRelations ? { vaga: true, candidato: true } : undefined,
    orderBy: { appliedAt: 'desc' },
  });
}

async function findByCandidatoId(
  candidatoId: number,
  includeRelations = false
): Promise<CandidaturaResponse[]> {
  return await prisma.candidatura.findMany({
    where: { candidatoId },
    include: includeRelations ? { vaga: true, candidato: true } : undefined,
    orderBy: { appliedAt: 'desc' },
  });
}

async function create(data: CreateCandidaturaInput): Promise<CandidaturaResponse | null> {
  try {
    // Verificar se já existe candidatura para essa vaga e candidato
    const exists = await prisma.candidatura.findUnique({
      where: {
        vagaId_candidatoId: {
          vagaId: data.vagaId,
          candidatoId: data.candidatoId,
        },
      },
    });

    if (exists) return null; // Já aplicou nessa vaga

    const candidatura = await prisma.candidatura.create({
      data: {
        vagaId: data.vagaId,
        candidatoId: data.candidatoId,
        status: data.status || 'Pendente',
        coverLetter: data.coverLetter || '',
      },
      include: { vaga: true, candidato: true },
    });
    return candidatura;
  } catch (error) {
    console.error('Erro ao criar candidatura:', error);
    return null;
  }
}

async function update(
  id: number,
  data: UpdateCandidaturaInput
): Promise<CandidaturaResponse | null> {
  try {
    const candidatura = await prisma.candidatura.update({
      where: { id },
      data: {
        ...(data.status !== undefined && { status: data.status }),
        ...(data.coverLetter !== undefined && { coverLetter: data.coverLetter }),
      },
      include: { vaga: true, candidato: true },
    });
    return candidatura;
  } catch (error) {
    console.error('Erro ao atualizar candidatura:', error);
    return null;
  }
}

async function remove(id: number): Promise<CandidaturaResponse | null> {
  try {
    const candidatura = await prisma.candidatura.findUnique({
      where: { id },
      include: { vaga: true, candidato: true },
    });
    if (!candidatura) return null;

    await prisma.candidatura.delete({ where: { id } });
    return candidatura;
  } catch (error) {
    console.error('Erro ao deletar candidatura:', error);
    return null;
  }
}

export { findAll, findById, findByVagaId, findByCandidatoId, create, update, remove };
