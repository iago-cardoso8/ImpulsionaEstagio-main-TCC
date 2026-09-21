import express, { Router, Request, Response } from 'express';
import * as NotificationModel from '../models/notificationModel.prisma';

const router: Router = express.Router();

interface ValidationError {
    status: number;
    erro: string;
    camposFaltantes?: string[];
}

function validarNotificacao(data: any): ValidationError | null {
    const camposObrigatorios = ['title', 'message', 'time'];
    const faltantes = camposObrigatorios.filter(campo => !data[campo] || data[campo].toString().trim() === '');
    if (faltantes.length > 0) {
        return { status: 400, erro: 'Campos obrigatórios ausentes', camposFaltantes: faltantes };
    }
    return null;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const notifications = await NotificationModel.findAll();
        res.status(200).json({ sucesso: true, quantidade: notifications.length, dados: notifications });
    } catch (erro: any) {
        console.error('Erro ao buscar notificações:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao buscar notificações' });
    }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const erroValidacao = validarNotificacao(req.body);
        if (erroValidacao) {
            res.status(erroValidacao.status).json(erroValidacao);
            return;
        }

        const notifications = await NotificationModel.create(req.body);
        res.status(201).json({ sucesso: true, mensagem: 'Notificação criada com sucesso', dados: notifications });
    } catch (erro: any) {
        console.error('Erro ao criar notificação:', erro.message);
        res.status(500).json({ sucesso: false, erro: 'Erro interno ao criar notificação' });
    }
});

export default router;
