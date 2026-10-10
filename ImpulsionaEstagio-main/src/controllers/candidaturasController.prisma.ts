import express, { Request, Response, Router } from 'express';
import { Prisma } from '@prisma/client';
import * as CandidaturasService from '../models/candidaturasModel.prisma';
import { CandidaturaResponse } from '../models/candidaturasModel.prisma';
import * as VagasService from '../models/vagasModel.prisma';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();
const statuses = ['Pendente', 'Aceito', 'Rejeitado'];

function requireRole(role: 'student' | 'company', req: Request, res: Response): boolean {
  if (req.user?.role === role) return true;
  res.status(403).json({ sucesso: false, erro: role === 'student' ? 'Apenas estudantes podem se candidatar' : 'Apenas empresas podem gerenciar candidaturas' });
  return false;
}

function safeCandidatura(candidatura: CandidaturaResponse): object {
  return {
    id: candidatura.id,
    vagaId: candidatura.vagaId,
    usuarioId: candidatura.usuarioId,
    status: candidatura.status,
    coverLetter: candidatura.coverLetter,
    appliedAt: candidatura.appliedAt,
    updatedAt: candidatura.updatedAt,
    vaga: candidatura.vaga,
    usuario: candidatura.usuario ? {
      id: candidatura.usuario.id,
      name: candidatura.usuario.name,
      email: candidatura.usuario.email,
      role: candidatura.usuario.role,
    } : undefined,
  };
}

router.post('/vagas/:id/candidaturas', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireRole('student', req, res)) return;
  const vagaId = Number(req.params.id);
  if (!Number.isInteger(vagaId) || vagaId < 1) {
    res.status(400).json({ sucesso: false, erro: 'ID de vaga inválido' });
    return;
  }
  try {
    if (!await VagasService.findById(vagaId)) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada' });
      return;
    }
    const candidatura = await CandidaturasService.create({ vagaId, usuarioId: req.user!.id });
    res.status(201).json({ sucesso: true, mensagem: 'Candidatura enviada', dados: safeCandidatura(candidatura) });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ sucesso: false, erro: 'Você já se candidatou a esta vaga' });
      return;
    }
    console.error('Erro ao criar candidatura:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao criar candidatura' });
  }
});

router.get('/candidaturas/minhas', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireRole('student', req, res)) return;
  try {
    const dados = await CandidaturasService.findByUsuarioId(req.user!.id, true);
    res.json({ sucesso: true, quantidade: dados.length, dados: dados.map(safeCandidatura) });
  } catch (error) {
    console.error('Erro ao listar candidaturas do estudante:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar candidaturas' });
  }
});

router.get('/vagas/:id/candidaturas', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireRole('company', req, res)) return;
  const vagaId = Number(req.params.id);
  if (!Number.isInteger(vagaId) || vagaId < 1) {
    res.status(400).json({ sucesso: false, erro: 'ID de vaga inválido' });
    return;
  }
  try {
    const vaga = await VagasService.findById(vagaId);
    if (!vaga) {
      res.status(404).json({ sucesso: false, erro: 'Vaga não encontrada' });
      return;
    }
    if (vaga.usuarioId !== req.user!.id) {
      res.status(403).json({ sucesso: false, erro: 'Acesso negado a esta vaga' });
      return;
    }
    const dados = await CandidaturasService.findByVagaId(vagaId, true);
    res.json({ sucesso: true, quantidade: dados.length, dados: dados.map(safeCandidatura) });
  } catch (error) {
    console.error('Erro ao listar candidaturas:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao listar candidaturas' });
  }
});

router.patch('/candidaturas/:id/status', requireAuth, async (req: Request, res: Response): Promise<void> => {
  if (!requireRole('company', req, res)) return;
  const candidaturaId = Number(req.params.id);
  const { status } = req.body as { status?: string };
  if (!Number.isInteger(candidaturaId) || candidaturaId < 1 || !statuses.includes(status || '')) {
    res.status(400).json({ sucesso: false, erro: 'ID ou status inválido' });
    return;
  }
  try {
    const candidatura = await CandidaturasService.findById(candidaturaId, true);
    if (!candidatura) {
      res.status(404).json({ sucesso: false, erro: 'Candidatura não encontrada' });
      return;
    }
    if (candidatura.vaga?.usuarioId !== req.user!.id) {
      res.status(403).json({ sucesso: false, erro: 'Acesso negado a esta candidatura' });
      return;
    }
    const dados = await CandidaturasService.update(candidaturaId, { status });
    res.json({ sucesso: true, mensagem: 'Status atualizado', dados: safeCandidatura(dados) });
  } catch (error) {
    console.error('Erro ao atualizar status da candidatura:', error);
    res.status(500).json({ sucesso: false, erro: 'Erro ao atualizar candidatura' });
  }
});

export default router;
