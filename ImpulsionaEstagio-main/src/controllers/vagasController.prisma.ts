import express, { Router, Request, Response } from 'express';
import * as VagasService from '../models/vagasModel.prisma';
import { requireAuth } from '../middleware/auth';

const router: Router = express.Router();
router.use((req, res, next): void => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
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
  campo?: string;
  camposRequeridos?: string[];
  camposFaltantes?: string[];
}

function validarCamposObrigatorios(data: any): ValidationError | null {
  const camposObrigatorios = ['title', 'company', 'location', 'salary', 'target', 'email'];
  const faltantes = camposObrigatorios.filter(
    (campo) => !data[campo] || String(data[campo]).trim() === ''
  );

  if (faltantes.length > 0) {
    return {
      status: 400,
      erro: 'Campos obrigatórios ausentes',
      camposRequeridos: camposObrigatorios,
      camposFaltantes: faltantes,
    };
  }
  return null;
}

function validarEmail(email: any): ValidationError | null {
  const emailStr = String(email || '');
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(emailStr)) {
    return {
      status: 400,
      erro: 'E-mail em formato inválido',
      campo: 'email',
    };
  }
  return null;
}

function validarSalary(salary: any): ValidationError | null {
  const salaryStr = String(salary || '');
  // Permite valores como "R$ 1200,00", "1200", "A combinar"
  if (salaryStr.toLowerCase() === 'a combinar') return null;
  
  const valor = Number(salaryStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
  if (Number.isNaN(valor) || valor <= 0) {
    return {
      status: 400,
      erro: 'Salário deve ser um valor numérico válido maior que zero ou "A combinar"',
      campo: 'salary',
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
// ROTAS - READ (GET)
// ────────────────────────────────────────────────────────────

/**
 * GET /api/vagas
 * Lista todas as vagas
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const vagas = await VagasService.findAll();
    res.status(200).json({
      sucesso: true,
      quantidade: vagas.length,
      dados: vagas,
    });
  } catch (erro: any) {
    console.error('Erro ao listar vagas:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao listar vagas',
    });
  }
});

/**
 * GET /api/vagas/:id
 * Busca uma vaga específica por ID
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    const vaga = await VagasService.findById(parseInt(req.params.id as string, 10));

    if (!vaga) {
      res.status(404).json({
        sucesso: false,
        erro: 'Vaga não encontrada',
        id: parseInt(req.params.id as string, 10),
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      dados: vaga,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao buscar vaga',
    });
  }
});

/**
 * GET /api/vagas/target/:target
 * Busca vagas por target (área)
 */
router.get('/target/:target', async (req: Request, res: Response): Promise<void> => {
  try {
    const vagas = await VagasService.findByTarget(String(req.params.target));
    res.status(200).json({
      sucesso: true,
      quantidade: vagas.length,
      dados: vagas,
    });
  } catch (erro: any) {
    console.error('Erro ao buscar vagas por target:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro ao buscar vagas por target',
    });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - CREATE (POST)
// ────────────────────────────────────────────────────────────

/**
 * POST /api/vagas
 * Cria uma nova vaga
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroValidacao =
      validarCamposObrigatorios(req.body) ||
      validarEmail(req.body.email as string) ||
      validarSalary(req.body.salary as string);

    if (erroValidacao) {
      res.status(erroValidacao.status).json(erroValidacao);
      return;
    }

    const novaVaga = await VagasService.create(req.body);

    if (!novaVaga) {
      res.status(500).json({
        sucesso: false,
        erro: 'Erro ao criar vaga',
      });
      return;
    }

    res.status(201).json({
      sucesso: true,
      mensagem: 'Vaga criada com sucesso',
      dados: novaVaga,
    });
  } catch (erro: any) {
    console.error('Erro ao criar vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao criar vaga',
    });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - UPDATE (PUT)
// ────────────────────────────────────────────────────────────

/**
 * PUT /api/vagas/:id
 * Atualiza uma vaga
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    // Validar apenas campos que foram fornecidos
    if (req.body.email) {
      const erroEmail = validarEmail(req.body.email);
      if (erroEmail) {
        res.status(erroEmail.status).json(erroEmail);
        return;
      }
    }

    if (req.body.salary) {
      const erroSalary = validarSalary(req.body.salary);
      if (erroSalary) {
        res.status(erroSalary.status).json(erroSalary);
        return;
      }
    }

    const id = parseInt(req.params.id as string, 10);
    const vagaExistente = await VagasService.findById(id);

    if (!vagaExistente) {
      res.status(404).json({
        sucesso: false,
        erro: 'Vaga não encontrada',
        id: id,
      });
      return;
    }

    const vagaAtualizada = await VagasService.update(id, req.body);

    res.status(200).json({
      sucesso: true,
      mensagem: 'Vaga atualizada com sucesso',
      dados: vagaAtualizada,
    });
  } catch (erro: any) {
    console.error('Erro ao atualizar vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao atualizar vaga',
    });
  }
});

// ────────────────────────────────────────────────────────────
// ROTAS - DELETE
// ────────────────────────────────────────────────────────────

/**
 * DELETE /api/vagas/:id
 * Deleta uma vaga
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const erroId = validarId(req.params.id);
    if (erroId) {
      res.status(erroId.status).json(erroId);
      return;
    }

    const id = parseInt(req.params.id as string, 10);
    const vagaRemovida = await VagasService.remove(id);

    if (!vagaRemovida) {
      res.status(404).json({
        sucesso: false,
        erro: 'Vaga não encontrada',
        id: id,
      });
      return;
    }

    res.status(200).json({
      sucesso: true,
      mensagem: 'Vaga removida com sucesso',
      dados: vagaRemovida,
    });
  } catch (erro: any) {
    console.error('Erro ao remover vaga:', erro.message);
    res.status(500).json({
      sucesso: false,
      erro: 'Erro interno do servidor ao remover vaga',
    });
  }
});

export default router;
