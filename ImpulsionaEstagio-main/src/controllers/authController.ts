import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();
const prisma = new PrismaClient();
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32 || jwtSecret === 'troque-por-uma-chave-secreta-forte' || jwtSecret === 'gere-uma-chave-com-openssl-rand-hex-32') {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser o valor de exemplo.');
}

function publicUser(user: { id: number; name: string; email: string; role: string }, perfil?: { campus?: string | null } | null) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(perfil?.campus ? { campus: perfil.campus } : {}),
  };
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
  const roleRaw = String(req.body.role || '').trim().toLowerCase();
  const role = roleRaw === 'company' ? 'company' : 'student';
  const course = String(req.body.course || '').trim();
  const campus = String(req.body.campus || '').trim();

  if (name.length < 2 || !validEmail(email) || password.length < 6) {
    res.status(400).json({ sucesso: false, erro: 'Nome, e-mail válido e senha com no mínimo 6 caracteres são obrigatórios' });
    return;
  }

  if (role === 'student' && (!course || !campus)) {
    res.status(400).json({ sucesso: false, erro: 'Curso e campus são obrigatórios para estudantes' });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.usuario.create({
        data: {
          name,
          email,
          passwordHash,
          role,
        },
      });

      if (role === 'student') {
        await tx.perfil.create({
          data: {
            name,
            email,
            course,
            campus,
            usuarioId: newUser.id,
            status: '',
            availability: '',
          },
        });
      }

      return newUser;
    });

    const perfil = role === 'student' ? await prisma.perfil.findUnique({ where: { usuarioId: user.id } }) : null;
    res.status(201).json({
      sucesso: true,
      mensagem: 'Usuário cadastrado com sucesso',
      usuario: publicUser(user, perfil),
      token: issueToken(user),
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ sucesso: false, erro: 'Este e-mail já está cadastrado' });
      return;
    }
    res.status(500).json({ sucesso: false, erro: 'Erro interno ao cadastrar usuário' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await prisma.usuario.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ sucesso: false, erro: 'E-mail ou senha inválidos' });
      return;
    }

    const perfil = await prisma.perfil.findUnique({ where: { usuarioId: user.id } });
    res.json({ sucesso: true, mensagem: 'Login realizado com sucesso', usuario: publicUser(user, perfil), token: issueToken(user) });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor ao realizar login' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.usuario.findUnique({ where: { id: req.user!.id }, include: { perfil: true } });
    res.json({ sucesso: true, usuario: user ? publicUser(user, user.perfil) : null, perfil: user?.perfil || null });
  } catch (error) {
    res.status(500).json({ sucesso: false, erro: 'Erro interno do servidor ao buscar usuário' });
  }
});

router.post('/logout', requireAuth, (_req: Request, res: Response): void => {
  res.json({ sucesso: true, mensagem: 'Logout realizado. Remova o token armazenado no cliente.' });
});

export default router;