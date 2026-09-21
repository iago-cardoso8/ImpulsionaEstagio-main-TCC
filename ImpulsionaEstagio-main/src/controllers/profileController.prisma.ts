import express, { Router, Request, Response } from 'express';
import * as PerfilService from '../models/perfilModel.prisma';

const router: Router = express.Router();

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

interface ValidationError {
  status: number;
  erro: string;
  campo?: string;
  camposFaltantes?: string[];
}

function validarEmail(email: any): ValidationError | null {
  const emailStr = String(email || '');
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(emailStr)) {
    return { status: 400, erro: 'E-mail em formato inválido', campo: 'email' };
  }
  return null;
}

function validarCampos(data: any): ValidationError | null {
  const camposObrigatorios = ['name', 'email', 'course', 'campus'];
  const faltantes = camposObrigatorios.filter(
    (campo) => !data[campo] || data[campo].toString().trim() === ''
  );
  if (faltantes.length > 0) {
    return { status: 400, erro: 'Campos obrigatórios ausentes', camposFaltantes: faltantes };
  }
  return null;
}

// ────────────────────────────────────────────────────────────
// ROTAS
// ────────────────────────────────────────────────────────────

/**
 * GET /api/perfil
 * Busca o perfil do usuário autenticado.
 * O frontend espera um único objeto em `dados`, não uma lista.
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const perfil = await PerfilService.findByUsuarioId(req.user!.id);

    if (!perfil) {
      res.status(404).json({
        sucesso: false,
        erro: 'Nenhum perfil encontrado',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: perfil,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar perfil',
    });
  }
});

/**
 * GET /api/perfil/:id
 * Busca um perfil específico por ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        sucesso: false,
        erro: 'ID inválido',
      });
      return;
    }

    const perfil = await PerfilService.findById(id);
    if (!perfil) {
      res.status(404).json({
        sucesso: false,
        erro: 'Perfil não encontrado',
      });
      return;
    }
    if (perfil.usuarioId !== req.user!.id) {
      res.status(403).json({ sucesso: false, erro: 'Acesso negado a este perfil' });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: perfil,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao buscar perfil',
    });
  }
});

/**
 * POST /api/perfil
 * Cria um novo perfil
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroValidacao = validarCampos(req.body) || validarEmail(req.body.email);
    if (erroValidacao) {
      res.status(erroValidacao.status).json(erroValidacao);
      return;
    }

    const novoPerfil = await PerfilService.create({ ...req.body, usuarioId: req.user!.id });
    if (!novoPerfil) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar perfil',
      });
      return;
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Perfil criado com sucesso',
      dados: novoPerfil,
    });
  } catch (erro: any) {
    console.error('Erro ao criar perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao criar perfil',
    });
  }
});

/**
 * PUT /api/perfil
 * Atualiza ou cria o perfil do usuário autenticado.
 * O frontend não envia ID — opera sobre o perfil associado ao token.
 */
router.put('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validar email se fornecido
    if (req.body.email) {
      const erroEmail = validarEmail(req.body.email);
      if (erroEmail) {
        res.status(erroEmail.status).json(erroEmail);
        return;
      }
    }

    const perfilExistente = await PerfilService.findByUsuarioId(req.user!.id);
    let perfilAtualizado;

    if (perfilExistente) {
      perfilAtualizado = await PerfilService.update(perfilExistente.id, req.body);
    } else {
      // Não há perfil — validar campos obrigatórios e criar
      const erroValidacao = validarCampos(req.body);
      if (erroValidacao) {
        res.status(erroValidacao.status).json(erroValidacao);
        return;
      }
      perfilAtualizado = await PerfilService.create({ ...req.body, usuarioId: req.user!.id });
    }

    if (!perfilAtualizado) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao salvar perfil',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Perfil salvo com sucesso',
      dados: perfilAtualizado,
    });
  } catch (erro: any) {
    console.error('Erro ao salvar perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao salvar perfil',
    });
  }
});

/**
 * PUT /api/perfil/:id
 * Atualiza um perfil específico por ID
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        sucesso: false,
        erro: 'ID inválido',
      });
      return;
    }

    // Validar email se fornecido
    if (req.body.email) {
      const erroEmail = validarEmail(req.body.email);
      if (erroEmail) {
        res.status(erroEmail.status).json(erroEmail);
        return;
      }
    }

    const perfilExistente = await PerfilService.findById(id);
    if (!perfilExistente) {
      res.status(404).json({
        sucesso: false,
        erro: 'Perfil não encontrado',
      });
      return;
    }
    if (perfilExistente.usuarioId !== req.user!.id) {
      res.status(403).json({ sucesso: false, erro: 'Acesso negado a este perfil' });
      return;
    }

    const perfilAtualizado = await PerfilService.update(id, req.body);
    if (!perfilAtualizado) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao atualizar perfil',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Perfil atualizado com sucesso',
      dados: perfilAtualizado,
    });
  } catch (erro: any) {
    console.error('Erro ao atualizar perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao atualizar perfil',
    });
  }
});

/**
 * DELETE /api/perfil/:id
 * Deleta um perfil
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        sucesso: false,
        erro: 'ID inválido',
      });
      return;
    }

    const perfilExistente = await PerfilService.findById(id);
    if (!perfilExistente) {
      res.status(404).json({ sucesso: false, erro: 'Perfil não encontrado' });
      return;
    }
    if (perfilExistente.usuarioId !== req.user!.id) {
      res.status(403).json({ sucesso: false, erro: 'Acesso negado a este perfil' });
      return;
    }

    const perfilRemovido = await PerfilService.remove(id);
    if (!perfilRemovido) {
      res.status(404).json({
        sucesso: false,
        erro: 'Perfil não encontrado',
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Perfil removido com sucesso',
      dados: perfilRemovido,
    });
  } catch (erro: any) {
    console.error('Erro ao remover perfil:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno ao remover perfil',
    });
  }
});

export default router;
