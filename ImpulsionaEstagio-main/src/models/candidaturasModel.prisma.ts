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
  usuarioId: number;
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
  usuarioId: number;
  status: string;
  coverLetter: string;
  appliedAt: Date;
  updatedAt: Date;
  vaga?: any;
  usuario?: any;
}

// ──────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

async function findById(id: number, includeRelations = false): Promise<CandidaturaResponse | null> {
  const candidatura = await prisma.candidatura.findUnique({
    where: { id },
    include: includeRelations ? { vaga: true, usuario: true } : undefined,
  });
  return candidatura;
}

async function findByVagaId(vagaId: number, includeRelations = false): Promise<CandidaturaResponse[]> {
  return await prisma.candidatura.findMany({
    where: { vagaId },
    include: includeRelations ? { vaga: true, usuario: true } : undefined,
    orderBy: { appliedAt: 'desc' },
  });
}

async function findByUsuarioId(
  usuarioId: number,
  includeRelations = false
): Promise<CandidaturaResponse[]> {
  return await prisma.candidatura.findMany({
    where: { usuarioId },
    include: includeRelations ? { vaga: true, usuario: true } : undefined,
    orderBy: { appliedAt: 'desc' },
  });
}

async function create(data: CreateCandidaturaInput): Promise<CandidaturaResponse> {
  return prisma.candidatura.create({
    data: {
      vagaId: data.vagaId,
      usuarioId: data.usuarioId,
      status: data.status || 'Pendente',
      coverLetter: data.coverLetter || '',
    },
    include: { vaga: true, usuario: true },
  });
}

async function update(
  id: number,
  data: UpdateCandidaturaInput
): Promise<CandidaturaResponse> {
  return prisma.candidatura.update({
    where: { id },
    data: {
      ...(data.status !== undefined && { status: data.status }),
      ...(data.coverLetter !== undefined && { coverLetter: data.coverLetter }),
    },
    include: { vaga: true, usuario: true },
  });
}

export { findById, findByVagaId, findByUsuarioId, create, update };
