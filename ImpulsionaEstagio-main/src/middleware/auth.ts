import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado');
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    res.status(401).json({ sucesso: false, erro: 'Autenticação necessária' });
    return;
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as unknown as AuthUser;
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ sucesso: false, erro: 'Usuário não encontrado' });
      return;
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
  }
}