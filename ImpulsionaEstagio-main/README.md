# Impulsiona Estágio

Aplicação web para divulgação de vagas de estágio, gestão de candidaturas e perfis de estudantes. O sistema usa Node.js, Express 4, TypeScript, Prisma 5 e SQLite; a interface é HTML/CSS com TypeScript compilado para JavaScript em `public/js`.

## Funcionalidades existentes

- Cadastro e autenticação de estudantes (`student`) e empresas (`company`).
- Senhas armazenadas com bcrypt, fator 12; JWT com validade de duas horas.
- Consulta pública de vagas; empresas cadastradas publicam, alteram e removem somente as próprias vagas.
- Perfil associado ao usuário autenticado.
- Candidaturas de estudantes a vagas, consulta das próprias candidaturas e gestão de status pela empresa proprietária.
- Gestão de notificações somente por empresas autenticadas.
- Interface web para vagas, perfis, candidaturas e notificações de empresas.

O campo `Vaga.time` é mantido no banco por compatibilidade. A interface calcula e exibe o tempo relativo com base em `createdAt`.

## Requisitos e configuração

- Node.js 20 ou superior.
- npm.
- OpenSSL para gerar o segredo JWT (ou outro gerador criptograficamente seguro).

```bash
npm install
cp .env.example .env
openssl rand -hex 32
```

Copie a saída do último comando para `JWT_SECRET` em `.env`. O servidor recusa iniciar quando essa variável está vazia, é curta, ou ainda tem o valor de exemplo. O arquivo `.env.example` também contém credenciais exclusivamente de desenvolvimento usadas pelo seed; altere-as se necessário.

## Preparar o banco e iniciar

```bash
npm run setup
npm run dev
```

`setup` executa `prisma generate`, aplica as migrations já versionadas com `prisma migrate deploy` e executa o seed idempotente. Acesse `http://localhost:3000`; `GET /health` é o endpoint de verificação operacional. O banco local padrão é `prisma/dev.db`, criado a partir das migrations. Para executar o seed separadamente: `npm run seed`.

Por padrão, o seed cria estas contas apenas para desenvolvimento:

| Papel | E-mail | Senha |
|---|---|---|
| Estudante | `student.dev@example.com` | `student-dev-only` |
| Empresa | `company.dev@example.com` | `company-dev-only` |

As variáveis `SEED_STUDENT_EMAIL`, `SEED_STUDENT_PASSWORD`, `SEED_COMPANY_EMAIL` e `SEED_COMPANY_PASSWORD` substituem os valores padrão.

## Desenvolvimento e testes

```bash
npm run typecheck
npm run build:front
npm test
```

`npm test` executa uma suíte automatizada com `node:test`, sobe a API e cria um banco SQLite exclusivo do processo de teste, aplicando nele `prisma migrate deploy`. O teste não usa nem apaga o banco de desenvolvimento. Os cenários imprimem o esperado e o obtido para autenticação, papéis, vagas, perfil, notificações e candidaturas.

## Papéis e autorização

- `student`: pode manter seu perfil e candidatar-se a vagas; só consulta as próprias candidaturas.
- `company`: pode gerenciar notificações e vagas; só altera/exclui vagas próprias e só consulta/altera candidaturas recebidas para suas vagas.
- A listagem e a consulta de vagas são públicas.
- As demais rotas protegidas recebem `Authorization: Bearer <token>`.

## Endpoints

| Método | Rota | Autenticação | Papel / autorização |
|---|---|---|---|
| `GET` | `/health` | Não | Público |
| `POST` | `/api/auth/register` | Não | Cria `student` ou `company` |
| `POST` | `/api/auth/login` | Não | Público; retorna JWT |
| `GET` | `/api/auth/me` | Sim | Usuário autenticado |
| `POST` | `/api/auth/logout` | Sim | Usuário autenticado; cliente remove o JWT |
| `GET` | `/api/vagas` | Não | Público |
| `GET` | `/api/vagas/target/:target` | Não | Público |
| `GET` | `/api/vagas/:id` | Não | Público |
| `POST` | `/api/vagas` | Sim | `company` |
| `PUT` | `/api/vagas/:id` | Sim | `company`, somente a dona |
| `DELETE` | `/api/vagas/:id` | Sim | `company`, somente a dona |
| `GET` | `/api/perfil` | Sim | Usuário autenticado; próprio perfil |
| `GET` | `/api/perfil/:id` | Sim | Usuário autenticado; próprio perfil |
| `POST` | `/api/perfil` | Sim | Usuário autenticado; próprio perfil |
| `PUT` | `/api/perfil` | Sim | Usuário autenticado; próprio perfil |
| `PUT` | `/api/perfil/:id` | Sim | Usuário autenticado; próprio perfil |
| `DELETE` | `/api/perfil/:id` | Sim | Usuário autenticado; próprio perfil |
| `GET` | `/api/notificacoes` | Sim | `company` |
| `GET` | `/api/notificacoes/:id` | Sim | `company` |
| `POST` | `/api/notificacoes` | Sim | `company` |
| `PUT` | `/api/notificacoes/:id` | Sim | `company` |
| `DELETE` | `/api/notificacoes/:id` | Sim | `company` |
| `POST` | `/api/vagas/:id/candidaturas` | Sim | `student`; uma candidatura por usuário/vaga |
| `GET` | `/api/candidaturas/minhas` | Sim | `student`; próprias candidaturas |
| `GET` | `/api/vagas/:id/candidaturas` | Sim | `company`; dona da vaga |
| `PATCH` | `/api/candidaturas/:id/status` | Sim | `company`; dona da vaga; `Pendente`, `Aceito` ou `Rejeitado` |

Rotas desconhecidas sob `/api` retornam 404 em JSON. Operações de autenticação têm limitação de tentativas e o JSON de entrada é limitado a 100 KB.

## Organização do projeto

```text
.
├── docs/                 # ERD e documentação da entrega
├── prisma/               # schema, migrations e seed
├── public/                # HTML/CSS, assets e JavaScript compilado
│   ├── css/
│   └── js/                # fontes TypeScript e saída JavaScript
├── scripts/               # suíte de API e utilitários de limpeza protegidos
├── src/
│   ├── controllers/       # endpoints Express
│   ├── middleware/        # autenticação JWT
│   └── models/            # acesso ao SQLite por Prisma
├── server.ts
├── requests.http
└── package.json
```

O diagrama entidade-relacionamento está em [docs/erd-migration.mmd](./docs/erd-migration.mmd).

## Limitações conhecidas

- O JWT é armazenado no `localStorage` do navegador; XSS pode expô-lo.
- Logout remove o token no cliente, mas não revoga tokens já emitidos.
- Não há recuperação de senha, upload de currículo, paginação nem aplicação móvel.
- SQLite é adequado à demonstração e desenvolvimento deste projeto, mas não oferece a mesma concorrência/escalabilidade de um banco servidor.
- Vagas existentes sem dono (registros legados) não podem ser editadas por empresas.
