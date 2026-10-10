import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32 || jwtSecret === 'troque-por-uma-chave-secreta-forte' || jwtSecret === 'gere-uma-chave-com-openssl-rand-hex-32') {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser o valor de exemplo.');
}

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  name?: string;
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

  let payload: jwt.JwtPayload;
  try {
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === 'string' || typeof decoded.id !== 'number') {
      res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
      return;
    }
    payload = decoded;
  } catch {
    res.status(401).json({ sucesso: false, erro: 'Token inválido ou expirado' });
    return;
  }

  try {
    const user = await prisma.usuario.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ sucesso: false, erro: 'Usuário não encontrado' });
      return;
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    // include name for downstream authorization decisions
    if (user.name) req.user.name = user.name;
    next();
  } catch (error) {
    next(error);
  }
}