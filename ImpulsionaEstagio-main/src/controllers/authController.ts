import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (!jwtSecret) {
  throw new Error('JWT_SECRET não configurado');
}

function publicUser(user: { id: number; name: string; email: string; role: string }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function issueToken(user: { id: number; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '2h' });
}

function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (name.length < 2 || !validEmail(email) || password.length < 6) {
    res.status(400).json({ sucesso: false, erro: 'Nome, e-mail válido e senha com no mínimo 6 caracteres são obrigatórios' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.usuario.create({ data: { name, email, passwordHash } });
    res.status(201).json({ sucesso: true, mensagem: 'Usuário cadastrado com sucesso', usuario: publicUser(user), token: issueToken(user) });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ sucesso: false, erro: 'Este e-mail já está cadastrado' });
      return;
    }
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao cadastrar usuário' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const user = await prisma.usuario.findUnique({ where: { email } });
  if (!user) {
    res.status(404).json({ sucesso: false, erro: 'Email de cadastro não encontrado. Faça login.' });
    return;
  }
  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    res.status(401).json({ sucesso: false, erro: 'Senha incorreta. Tente novamente.' });
    return;
  }
  res.json({ sucesso: true, mensagem: 'Login realizado com sucesso', usuario: publicUser(user), token: issueToken(user) });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.usuario.findUnique({ where: { id: req.user!.id }, include: { perfil: true } });
  res.json({ sucesso: true, usuario: user ? publicUser(user) : null, perfil: user?.perfil || null });
});

router.post('/logout', requireAuth, (_req: Request, res: Response): void => {
  res.json({ sucesso: true, mensagem: 'Logout realizado. Remova o token armazenado no cliente.' });
});

export default router;