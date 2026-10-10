import express, { Express } from 'express';
import path from 'path';
import morgan from 'morgan';
import 'dotenv/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Controllers com Prisma
import vagasController from './src/controllers/vagasController.prisma';
import profileController from './src/controllers/profileController.prisma';
import notificationController from './src/controllers/notificationController.prisma';
import authController from './src/controllers/authController';
import candidaturasController from './src/controllers/candidaturasController.prisma';
import { requireAuth } from './src/middleware/auth';

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);
const jwtSecret = process.env.JWT_SECRET || '';
if (jwtSecret.length < 32 || jwtSecret === 'troque-por-uma-chave-secreta-forte' || jwtSecret === 'gere-uma-chave-com-openssl-rand-hex-32') {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres e não pode ser o valor de exemplo.');
}

function startServer(port: number): void {
    const server = app.listen(port, () => {
        console.log(`
╔═══════════════════════════════════════════╗
║  🚀 Servidor Impulsiona Estágio           ║
║  URL: http://localhost:${port}            ║
║  Environment: ${process.env.NODE_ENV || 'development'}              ║
║  Database: SQLite + Prisma ORM            ║
╚═══════════════════════════════════════════╝
        `);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
            console.warn(`Porta ${port} ocupada. Tentando ${port + 1}...`);
            server.close(() => startServer(port + 1));
            return;
        }

        console.error('Erro ao iniciar o servidor:', error);
        process.exit(1);
    });
}

// ── Middlewares ─────────────────────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// ── Rotas API ────────────────────────────────────────────────────
function createAuthRateLimit() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 10,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { sucesso: false, erro: 'Muitas tentativas. Tente novamente em alguns minutos.' },
    });
}
app.use('/api/auth/login', createAuthRateLimit());
app.use('/api/auth/register', createAuthRateLimit());
app.use('/api/auth', authController);
/**
 * @route GET /api/vagas
 * @desc Listar todas as vagas
 */
app.use('/api/vagas', vagasController);

/**
 * @route GET /api/perfil
 * @desc Gerenciar perfil do usuário
 */
app.use('/api/perfil', requireAuth, profileController);

/**
 * @route GET /api/notificacoes
 * @desc Listar todas as notificações
 */
app.use('/api/notificacoes', notificationController);
app.use('/api', candidaturasController);

app.use('/api', (_req, res) => {
    res.status(404).json({ sucesso: false, erro: 'Rota da API não encontrada' });
});

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        sucesso: true,
        mensagem: 'Servidor operacional',
        timestamp: new Date().toISOString()
    });
});

// ── Error Handler ────────────────────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        sucesso: false,
        erro: 'Erro interno do servidor',
        ...(process.env.NODE_ENV !== 'production' && { mensagem: err.message })
    });
});

// ── Start ────────────────────────────────────────────────────────
startServer(PORT);
