import { PrismaClient, Notification } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  errorFormat: 'pretty',
});

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  title: string;
  message: string;
  time: string;
}

export interface UpdateNotificationInput {
  title?: string;
  message?: string;
  time?: string;
}

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  time: string;
  createdAt: Date;
}

// ──────────────────────────────────────────────────────────────
// CRUD OPERATIONS
// ──────────────────────────────────────────────────────────────

async function findAll(): Promise<NotificationResponse[]> {
  return await prisma.notification.findMany({
    orderBy: { createdAt: 'desc' },
  });
}

async function findById(id: number): Promise<NotificationResponse | null> {
  return await prisma.notification.findUnique({
    where: { id },
  });
}

async function create(data: CreateNotificationInput): Promise<NotificationResponse | null> {
  try {
    return await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        time: data.time,
      },
    });
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    return null;
  }
}

async function update(
  id: number,
  data: UpdateNotificationInput
): Promise<NotificationResponse | null> {
  try {
    return await prisma.notification.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.message !== undefined && { message: data.message }),
        ...(data.time !== undefined && { time: data.time }),
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar notificação:', error);
    return null;
  }
}

async function remove(id: number): Promise<NotificationResponse | null> {
  try {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) return null;

    await prisma.notification.delete({ where: { id } });
    return notification;
  } catch (error) {
    console.error('Erro ao deletar notificação:', error);
    return null;
  }
}

export { findAll, findById, create, update, remove };
