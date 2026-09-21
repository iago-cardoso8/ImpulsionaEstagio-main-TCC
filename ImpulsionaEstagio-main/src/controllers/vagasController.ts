import express, { Router, Request, Response } from 'express';
import * as VagasModel from '../models/vagasModel.prisma';

const router: Router = express.Router();

// ────────────────────────────────────────────────────────────
// Type Definitions
// ────────────────────────────────────────────────────────────

interface ValidationError {
    status: number;
    erro: string;
    campo?: string;
    camposRequeridos?: string[];
    camposFaltantes?: string[];
}

// ────────────────────────────────────────────────────────────
// VALIDAÇÕES
// ────────────────────────────────────────────────────────────

function validarCamposObrigatorios(data: any): ValidationError | null {
    const camposObrigatorios = ['title', 'company', 'location', 'salary', 'target', 'email'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || String(data[campo]).trim() === '');
    
    if (faltantes.length > 0) {
        return {
            status: 400,
            erro: 'Campos obrigatórios ausentes',
            camposRequeridos: camposObrigatorios,
            camposFaltantes: faltantes
        };
    }
    return null;
}

function validarEmail(email: string | string[] | undefined): ValidationError | null {
    const emailStr = String(email || '');
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(emailStr)) {
        return {
            status: 400,
            erro: 'E-mail em formato inválido',
            campo: 'email'
        };
    }
    return null;
}

function validarSalary(salary: any): ValidationError | null {
    const salaryStr = String(salary || '');
    const valor = Number(salaryStr.replace(/[^0-9.,]/g, '').replace(',', '.'));
    if (Number.isNaN(valor) || valor <= 0) {
        return {
            status: 400,
            erro: 'Salário deve ser um valor numérico válido maior que zero',
            campo: 'salary'
        };
    }
    return null;
}

function validarId(id: string | string[] | undefined): ValidationError | null {
    const idStr = String(id || '');
    const idNum = parseInt(idStr, 10);
    if (isNaN(idNum) || idNum <= 0) {
        return {
            status: 400,
            erro: 'ID inválido. Deve ser um número inteiro positivo'
        };
    }
    return null;
}

// ────────────────────────────────────────────────────────────
// ROTAS - READ (GET)
// ────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const vagas = await VagasModel.findAll();
        res.status(200).json({
            sucesso: true,
            quantidade: vagas.length,
            dados: vagas
        });
    } catch (erro: any) {
        console.error('Erro ao listar vagas:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao listar vagas'
        });
    }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            res.status(erroId.status).json(erroId);
            return;
        }

        const vaga = await VagasModel.findById(parseInt(req.params.id as string, 10));

        if (!vaga) {
            res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: parseInt(req.params.id as string, 10)
            });
            return;
        }

        res.status(200).json({
            sucesso: true,
            dados: vaga
        });
    } catch (erro: any) {
        console.error('Erro ao buscar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao buscar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - CREATE (POST)
// ────────────────────────────────────────────────────────────

router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const erroValidacao = validarCamposObrigatorios(req.body) || validarEmail(req.body.email as string) || validarSalary(req.body.salary as string);
        if (erroValidacao) {
            res.status(erroValidacao.status).json(erroValidacao);
            return;
        }

        const novaVaga = await VagasModel.create(req.body);
        
        res.status(201).json({
            sucesso: true,
            mensagem: 'Vaga criada com sucesso',
            dados: novaVaga
        });
    } catch (erro: any) {
        console.error('Erro ao criar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao criar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - UPDATE (PUT)
// ────────────────────────────────────────────────────────────

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            res.status(erroId.status).json(erroId);
            return;
        }

        const erroValidacao = validarCamposObrigatorios(req.body) || validarEmail(req.body.email as string) || validarSalary(req.body.salary as string);
        if (erroValidacao) {
            res.status(erroValidacao.status).json(erroValidacao);
            return;
        }

        const id = parseInt(req.params.id as string, 10);

        const vagaExistente = await VagasModel.findById(id);
        if (!vagaExistente) {
            res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: id
            });
            return;
        }

        const vagaAtualizada = await VagasModel.update(id, req.body);

        res.status(200).json({
            sucesso: true,
            mensagem: 'Vaga atualizada com sucesso',
            dados: vagaAtualizada
        });
    } catch (erro: any) {
        console.error('Erro ao atualizar vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao atualizar vaga'
        });
    }
});

// ────────────────────────────────────────────────────────────
// ROTAS - DELETE
// ────────────────────────────────────────────────────────────

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
    try {
        const erroId = validarId(req.params.id);
        if (erroId) {
            res.status(erroId.status).json(erroId);
            return;
        }

        const id = parseInt(req.params.id as string, 10);

        const vagaRemovida = await VagasModel.remove(id);

        if (!vagaRemovida) {
            res.status(404).json({
                sucesso: false,
                erro: 'Vaga não encontrada',
                id: id
            });
            return;
        }

        res.status(200).json({
            sucesso: true,
            mensagem: 'Vaga removida com sucesso',
            dados: vagaRemovida
        });
    } catch (erro: any) {
        console.error('Erro ao remover vaga:', erro.message);
        res.status(500).json({
            sucesso: false,
            erro: 'Erro interno do servidor ao remover vaga'
        });
    }
});

export default router;
