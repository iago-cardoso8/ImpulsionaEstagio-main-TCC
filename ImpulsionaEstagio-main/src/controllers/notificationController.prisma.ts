import express, { Router, Request, Response } from 'express';
import * as NotificationService from '../models/notificationModel.prisma';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();
router.use((req, res, next): void => {
  if (req.method !== 'GET') {
    void requireAuth(req, res, next);
    return;
  }
  next();
});

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

interface ValidationError {
  status: number;
  erro: string;
  camposFaltantes?: string[];
}

function validarNotificacao(data: any): ValidationError | null {
  const camposObrigatorios = ['title', 'message', 'time'];
  const faltantes = camposObrigatorios.filter(
    (campo) => !data[campo] || data[campo].toString().trim() === ''
  );
  if (faltantes.length > 0) {
    return {
      status: 400,
      erro: 'Campos obrigatórios ausentes',
      camposFaltantes: faltantes,
    };
  }
  return null;
}

function validarId(id: any): ValidationError | null {
  const idStr = String(id || '');
  const idNum = parseInt(idStr, 10);
  if (isNaN(idNum) || idNum <= 0) {
    return {
      status: 400,
      erro: 'ID inválido. Deve ser um número inteiro positivo',
    };
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// ROTAS
// ────────────────────────────────────────────────────────────

/**
 * GET /api/notificacoes
 * Lista todas as notificações
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const notificacoes = await NotificationService.findAll();
    res.status(200).json({
      sucesso: true,
      quantidade: notificacoes.length,
      dados: notificacoes,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar notificações:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar notificações',
    });
  }
});

/**
 * GET /api/notificacoes/:id
 * Busca uma notificação específica
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    const notificacao = await NotificationService.findById(parseInt(String(req.params.id), 10));
    if (!notificacao) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: notificacao,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar notificação',
    });
  }
});

/**
 * POST /api/notificacoes
 * Cria uma nova notificação
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroValidacao = validarNotificacao(req.body);
    if (erroValidacao) {
      res.status(erroValidacao.status).json(erroValidacao);
      return;
    }

    const novaNotificacao = await NotificationService.create(req.body);
    if (!novaNotificacao) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar notificação',
      });
      return;
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Notificação criada com sucesso',
      dados: novaNotificacao,
    });
  } catch (erro: any) {
    console.error('Erro ao criar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao criar notificação',
    });
  }
});

/**
 * PUT /api/notificacoes/:id
 * Atualiza uma notificação
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    const notificacaoExistente = await NotificationService.findById(id);

    if (!notificacaoExistente) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    const notificacaoAtualizada = await NotificationService.update(id, req.body);
    if (!notificacaoAtualizada) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao atualizar notificação',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Notificação atualizada com sucesso',
      dados: notificacaoAtualizada,
    });
  } catch (erro: any) {
    console.error('Erro ao atualizar notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao atualizar notificação',
    });
  }
});

/**
 * DELETE /api/notificacoes/:id
 * Deleta uma notificação
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    const id = parseInt(String(req.params.id), 10);
    const notificacaoRemovida = await NotificationService.remove(id);

    if (!notificacaoRemovida) {
      res.status(404).json({
        sucesso: false,
        erro: 'Notificação não encontrada',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Notificação removida com sucesso',
      dados: notificacaoRemovida,
    });
  } catch (erro: any) {
    console.error('Erro ao remover notificação:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao remover notificação',
    });
  }
});

export default router;
