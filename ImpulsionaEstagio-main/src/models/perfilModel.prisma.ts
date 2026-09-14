import { PrismaClient, Perfil } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface CreatePerfilInput {
  name: string;
  email: string;
  course: string;
  campus: string;
  usuarioId: number;
  status?: string;
  availability?: string;
}

export interface UpdatePerfilInput {
  name?: string;
  email?: string;
  course?: string;
  campus?: string;
  status?: string;
  availability?: string;
}

export interface PerfilResponse {
  id: number;
  name: string;
  email: string;
  course: string;
  campus: string;
  usuarioId: number | null;
  status: string;
  availability: string;
  createdAt: Date;
  updatedAt: Date;
}

// ──────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

async function findAll(): Promise<PerfilResponse[]> {
  return await prisma.perfil.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

async function findById(id: number): Promise<PerfilResponse | null> {
  return await prisma.perfil.findUnique({
    where: { id },
  });
}

async function findByUsuarioId(usuarioId: number): Promise<PerfilResponse | null> {
  return await prisma.perfil.findUnique({
    where: { usuarioId },
  });
}

async function findByEmail(email: string): Promise<PerfilResponse | null> {
  const perfis = await prisma.perfil.findMany({
    where: { email },
  });
  return perfis.length > 0 ? perfis[0] : null;
}

async function create(data: CreatePerfilInput): Promise<PerfilResponse | null> {
  try {
    return await prisma.perfil.create({
      data: {
        name: data.name,
        email: data.email,
        course: data.course,
        campus: data.campus,
        usuarioId: data.usuarioId,
        status: data.status || '',
        availability: data.availability || '',
      },
    });
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return null;
  }
}

async function update(id: number, data: UpdatePerfilInput): Promise<PerfilResponse | null> {
  try {
    return await prisma.perfil.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.course !== undefined && { course: data.course }),
        ...(data.campus !== undefined && { campus: data.campus }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.availability !== undefined && { availability: data.availability }),
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return null;
  }
}

async function remove(id: number): Promise<PerfilResponse | null> {
  try {
    const perfil = await prisma.perfil.findUnique({ where: { id } });
    if (!perfil) return null;

    await prisma.perfil.delete({ where: { id } });
    return perfil;
  } catch (error) {
    console.error('Erro ao deletar perfil:', error);
    return null;
  }
}

export { findAll, findById, findByUsuarioId, findByEmail, create, update, remove };
