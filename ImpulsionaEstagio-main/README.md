# Impulsiona Estágio

Aplicação web de oportunidades de estágio integrada ao back-end em Node.js/Express.js com Prisma ORM e SQLite.

## O que foi implementado

- Modelagem do banco de dados com Prisma e schema no arquivo prisma/schema.prisma
- Arquitetura MVC com separação entre models, controllers e rotas
- Operações CRUD para vagas, perfil e notificações
- Migrations e seed para criação e população inicial do banco
- Interface web com criação, listagem, edição e remoção de vagas
- Testes de API via REST Client no arquivo requests.http
- Autenticação com bcrypt, JWT, middleware e rotas protegidas

## Estrutura principal

- server.ts: configuração do Express, middlewares, rotas e health check
- src/controllers: controllers responsáveis por receber requisições HTTP e responder
- src/models: camada de acesso ao banco com Prisma Client
- prisma/schema.prisma: definição dos modelos e relacionamentos
- prisma/seed.ts: dados iniciais para desenvolvimento e testes
- public: interface web em HTML/CSS/TypeScript

## Modelagem do banco de dados

O schema define os modelos:

- Vaga: representa oportunidades de estágio e emprego
- Candidato: representa candidatos que se inscrevem
- Candidatura: relaciona vagas e candidatos
- Perfil: armazena dados do usuário/perfil do estudante
- Notification: representa notificações do sistema

O relacionamento principal é entre Vaga e Candidatura, onde uma vaga pode ter várias candidaturas e cada candidatura pertence a uma vaga e a um candidato.

O diagrama ERD está em docs/erd-migration.mmd.

## Arquitetura MVC

- Model: arquivos em src/models executam operações CRUD com Prisma Client
- Controller: arquivos em src/controllers recebem dados, validam entradas e retornam respostas HTTP
- Rotas: definidas em server.ts e nos controllers via Express Router

## Migrations e seed

Para criar e aplicar a estrutura do banco:

```bash
npx prisma migrate dev --name init
npm run seed
```

Os arquivos de migration ficam em prisma/migrations e o seed em prisma/seed.ts.

## Executando a aplicação

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Acesse http://localhost:3000.

## Testes da API

O arquivo requests.http contém requisições para:

- Listar, buscar, criar, atualizar e excluir vagas
- Casos inválidos e validação de formulário
- Testes de perfil e notificações

Use a extensão REST Client do VSCode para enviar as requisições.

## Autenticação

Configure `DATABASE_URL` e `JWT_SECRET` no arquivo `.env`; `JWT_SECRET` é obrigatório e deve ser uma chave forte, diferente do valor de exemplo. O cadastro usa `bcrypt` com fator 12 e grava somente `passwordHash`; o e-mail é único no banco. O login retorna um JWT com validade de duas horas. Envie-o como `Authorization: Bearer <token>` para acessar o próprio perfil e operações de escrita de vagas/notificações. O arquivo `requests.http` demonstra cadastro, validações, e-mail duplicado, login válido e inválido, acesso sem token, acesso autenticado e logout.

## CRUD no front-end

A interface em public permite:

- Criar novas vagas pelo formulário
- Visualizar vagas cadastradas na lista
- Editar vagas existentes
- Excluir vagas com confirmação
- Navegar entre as seções de vagas, cadastro, perfil e notificações
