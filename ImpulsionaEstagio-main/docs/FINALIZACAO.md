# Finalização do Impulsiona Estágio

## 1. Arquivos removidos e alterados

### Removidos do versionamento

- `prisma/dev.db` e `prisma/dev.db-journal`: banco e journal locais não devem ser distribuídos; migrations e seed são a fonte reproduzível do banco. As cópias locais já existentes foram preservadas no diretório de trabalho, mas deixaram de ser rastreadas.
- `src/models/candidatosModel.prisma.ts`: substituído pela relação direta de `Candidatura` com o usuário estudante.
- Diretório vazio `src/database/`: removido após confirmar que não continha arquivos e que nada o importava.

Os stubs `src/models/vagasModel.ts`, `notificationModel.ts` e `profileModel.ts`, os controllers antigos sem `.prisma`, os arquivos antigos da pasta `src/database`, `api.http` e `prisma.config.ts` não constavam no inventário inicial; não houve exclusão desses arquivos. `better-sqlite3` também já não constava das dependências.

### Adicionados

- `prisma/migrations/20261010190856_candidatura_usuario/migration.sql`: migra candidaturas legadas para usuários estudantes correspondentes.
- `src/controllers/candidaturasController.prisma.ts`: endpoints de candidatura e controle de autorização.
- Este documento.

### Alterados

- Configuração e instalação: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `tsconfig.json`.
- Banco: `prisma/schema.prisma`, `prisma/seed.ts` e a migration `20261008170000_normalize_legacy_user_role/migration.sql`.
- API: `server.ts`, controllers de autenticação, vagas, perfil e notificações, `src/middleware/auth.ts`, models de candidaturas e perfil.
- Interface: `public/index.html`, `public/css/style.css`, fontes `.ts` em `public/js/` e respectivos JavaScript gerados (`auth.js`, `dados.js`, `funcionalidades.js` e `main.js`).
- Testes e exemplos: `scripts/api_test.js`, `scripts/clear_tests.js`, `scripts/cleanup_vagas.js` e `requests.http`.
- Documentação: `README.md` e `docs/erd-migration.mmd`.

Motivos principais: completar a autorização e os fluxos de candidatura, reforçar validações e segurança, remover referências obsoletas, garantir a reprodução do banco e documentar o comportamento existente. O `build:front` recompila os arquivos JavaScript versionados a partir do TypeScript.

## 2. Árvore final de pastas

```text
ImpulsionaEstagio-main/
├── docs/
│   ├── Diagrama_BD_impulsiona.png
│   ├── erd-migration.mmd
│   └── FINALIZACAO.md
├── prisma/
│   ├── migrations/
│   │   ├── 20260629015148_init/
│   │   ├── 20260824004409_auth/
│   │   ├── 20260831020426_add_vaga_usuario_id/
│   │   ├── 20261008165820_default_student_role/
│   │   ├── 20261008170000_normalize_legacy_user_role/
│   │   └── 20261010190856_candidatura_usuario/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── css/style.css
│   ├── img/logo_impulsiona.png
│   ├── js/
│   │   ├── auth.ts / auth.js
│   │   ├── dados.ts / dados.js
│   │   ├── funcionalidades.ts / funcionalidades.js
│   │   ├── load.ts / load.js
│   │   ├── main.ts / main.js
│   │   ├── shared.ts / shared.js
│   │   ├── types.ts / types.js
│   │   └── if_campi_by_uf.json
│   └── index.html
├── scripts/
│   ├── api_test.js
│   ├── cleanup_vagas.js
│   └── clear_tests.js
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── candidaturasController.prisma.ts
│   │   ├── notificationController.prisma.ts
│   │   ├── profileController.prisma.ts
│   │   └── vagasController.prisma.ts
│   ├── middleware/auth.ts
│   └── models/
│       ├── candidaturasModel.prisma.ts
│       ├── notificationModel.prisma.ts
│       ├── perfilModel.prisma.ts
│       └── vagasModel.prisma.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── README.md
├── requests.http
├── server.ts
├── tsconfig.frontend.json
└── tsconfig.json
```

O banco SQLite é criado localmente em `prisma/dev.db` por `setup` e não faz parte da árvore versionada.

## 3. Tabela final de endpoints

| Método | Rota | Autenticação | Papel / autorização |
|---|---|---|---|
| `GET` | `/` | Não | Serve a aplicação estática |
| `GET` | `/health` | Não | Público |
| `POST` | `/api/auth/register` | Não | Cria estudante ou empresa |
| `POST` | `/api/auth/login` | Não | Público; retorna JWT de 2 horas |
| `GET` | `/api/auth/me` | Sim | Usuário autenticado |
| `POST` | `/api/auth/logout` | Sim | Usuário autenticado; não revoga JWT |
| `GET` | `/api/vagas` | Não | Público |
| `GET` | `/api/vagas/target/:target` | Não | Público |
| `GET` | `/api/vagas/:id` | Não | Público |
| `POST` | `/api/vagas` | Sim | `company` |
| `PUT` | `/api/vagas/:id` | Sim | `company`, dona da vaga |
| `DELETE` | `/api/vagas/:id` | Sim | `company`, dona da vaga |
| `GET` | `/api/perfil` | Sim | Perfil do usuário autenticado |
| `GET` | `/api/perfil/:id` | Sim | Somente o próprio perfil |
| `POST` | `/api/perfil` | Sim | Somente o próprio perfil |
| `PUT` | `/api/perfil` | Sim | Somente o próprio perfil; valida campos obrigatórios |
| `PUT` | `/api/perfil/:id` | Sim | Somente o próprio perfil |
| `DELETE` | `/api/perfil/:id` | Sim | Somente o próprio perfil |
| `GET` | `/api/notificacoes` | Sim | `company` |
| `GET` | `/api/notificacoes/:id` | Sim | `company` |
| `POST` | `/api/notificacoes` | Sim | `company` |
| `PUT` | `/api/notificacoes/:id` | Sim | `company` |
| `DELETE` | `/api/notificacoes/:id` | Sim | `company` |
| `POST` | `/api/vagas/:id/candidaturas` | Sim | `student`; duplicada retorna 409 |
| `GET` | `/api/candidaturas/minhas` | Sim | `student`; próprias candidaturas |
| `GET` | `/api/vagas/:id/candidaturas` | Sim | `company`; dona da vaga |
| `PATCH` | `/api/candidaturas/:id/status` | Sim | `company`; dona da vaga; `Pendente`, `Aceito` ou `Rejeitado` |

Rotas desconhecidas da API retornam JSON 404. As rotas autenticadas esperam o cabeçalho `Authorization` no esquema Bearer, com o JWT emitido no login.

## 4. Schema Prisma final

O schema abaixo foi copiado de `prisma/schema.prisma` após a validação com Prisma 5.22:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Vaga {
  id            Int       @id @default(autoincrement())
  title         String
  company       String
  location      String
  email         String
  time          String    @default("Agora mesmo")
  type          String    @default("Estágio")
  salary        String    @default("A combinar")
  target        String
  desc          String    @default("")
  requirements  String    @default("[]")
  benefits      String    @default("[]")
  usuarioId     Int?      @map("usuario_id")
  usuario       Usuario?  @relation(fields: [usuarioId], references: [id], onDelete: SetNull)
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  candidaturas  Candidatura[]

  @@map("vagas")
}

model Candidatura {
  id            Int       @id @default(autoincrement())
  vagaId        Int       @map("vaga_id")
  usuarioId     Int       @map("usuario_id")
  status        String    @default("Pendente")
  coverLetter   String    @default("") @map("cover_letter")
  appliedAt     DateTime  @default(now()) @map("applied_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  vaga          Vaga      @relation(fields: [vagaId], references: [id], onDelete: Cascade)
  usuario       Usuario   @relation(fields: [usuarioId], references: [id], onDelete: Cascade)

  @@map("candidaturas")
  @@unique([vagaId, usuarioId])
}

model Perfil {
  id            Int       @id @default(autoincrement())
  name          String
  email         String
  course        String
  campus        String
  status        String    @default("")
  availability  String    @default("")
  usuarioId     Int?      @unique @map("usuario_id")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  usuario       Usuario?  @relation(fields: [usuarioId], references: [id], onDelete: SetNull)

  @@map("perfil")
}

model Usuario {
  id           Int      @id @default(autoincrement())
  name         String
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         String   @default("student")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  perfil       Perfil?
  vagas        Vaga[]
  candidaturas Candidatura[]

  @@map("usuarios")
}

model Notification {
  id        Int      @id @default(autoincrement())
  title     String
  message   String
  time      String
  createdAt DateTime @default(now()) @map("created_at")

  @@map("notifications")
}
```

`Vaga.time` permanece no banco; a interface usa `createdAt` para calcular o tempo relativo de publicação.

## 5. Saída real de `npm test`

Executado no repositório após as alterações e atualizações de dependências. O runner criou um SQLite temporário, aplicou as seis migrations e concluiu todos os cenários:

```text
> impulsiona@2.0.0 test
> node --test scripts/api_test.js

Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "test-14855.db" at "file:./test-14855.db"

SQLite database test-14855.db created at file:./test-14855.db

6 migrations found in prisma/migrations

Applying migration `20260629015148_init`
Applying migration `20260824004409_auth`
Applying migration `20260831020426_add_vaga_usuario_id`
Applying migration `20261008165820_default_student_role`
Applying migration `20261008170000_normalize_legacy_user_role`
Applying migration `20261010190856_candidatura_usuario`

The following migration(s) have been applied:

migrations/
  └─ 20260629015148_init/
    └─ migration.sql
  └─ 20260824004409_auth/
    └─ migration.sql
  └─ 20260831020426_add_vaga_usuario_id/
    └─ migration.sql
  └─ 20261008165820_default_student_role/
    └─ migration.sql
  └─ 20261008170000_normalize_legacy_user_role/
    └─ migration.sql
  └─ 20261010190856_candidatura_usuario/
    └─ migration.sql
      
All migrations have been successfully applied.
CENÁRIO: Registro inválido | Esperado: 400 | Obtido: 400
CENÁRIO: Registro de empresa | Esperado: 201 | Obtido: 201
CENÁRIO: Registro de estudante | Esperado: 201 | Obtido: 201
CENÁRIO: Registro da segunda empresa | Esperado: 201 | Obtido: 201
▶ Fluxos de autenticação, permissões, vagas, perfil, notificações e candidaturas
  ✔ recusa registro inválido e permite registro válido (2059.862185ms)
CENÁRIO: E-mail duplicado | Esperado: 409 | Obtido: 409
CENÁRIO: Credenciais inválidas | Esperado: 401 | Obtido: 401
CENÁRIO: Login válido de estudante | Esperado: 200 | Obtido: 200
  ✔ impede e-mail duplicado e login inválido (1626.397302ms)
CENÁRIO: Perfil sem token | Esperado: 401 | Obtido: 401
CENÁRIO: Estudante tenta cadastrar vaga | Esperado: 403 | Obtido: 403
CENÁRIO: Rota inexistente da API | Esperado: 404 | Obtido: 404
  ✔ protege rotas e aplica permissões por papel (32.774877ms)
CENÁRIO: Empresa cria vaga | Esperado: 201 | Obtido: 201
CENÁRIO: Outra empresa tenta editar vaga | Esperado: 403 | Obtido: 403
CENÁRIO: Dono atualiza vaga | Esperado: 200 | Obtido: 200
CENÁRIO: Dono exclui vaga | Esperado: 200 | Obtido: 200
  ✔ cria, atualiza, protege e exclui vaga pelo dono (96.749584ms)
CENÁRIO: Perfil inválido não é gravado | Esperado: 400 | Obtido: 400
CENÁRIO: Estudante atualiza perfil | Esperado: 200 | Obtido: 200
CENÁRIO: Perfil de empresa com campos vazios | Esperado: 400 | Obtido: 400
CENÁRIO: Empresa cria perfil com campos obrigatórios | Esperado: 200 | Obtido: 200
  ✔ valida e atualiza perfil de estudante (62.609028ms)
CENÁRIO: Estudante acessa notificações | Esperado: 403 | Obtido: 403
CENÁRIO: Estudante cria notificação | Esperado: 403 | Obtido: 403
CENÁRIO: Empresa lista notificações | Esperado: 200 | Obtido: 200
CENÁRIO: Empresa cria notificação | Esperado: 201 | Obtido: 201
  ✔ restringe notificações a empresas (27.49146ms)
CENÁRIO: Empresa cria vaga para candidatura | Esperado: 201 | Obtido: 201
CENÁRIO: Empresa tenta se candidatar | Esperado: 403 | Obtido: 403
CENÁRIO: Estudante envia candidatura | Esperado: 201 | Obtido: 201
CENÁRIO: Candidatura duplicada | Esperado: 409 | Obtido: 409
CENÁRIO: Estudante lista candidaturas próprias | Esperado: 200 | Obtido: 200
CENÁRIO: Outra empresa lista candidaturas | Esperado: 403 | Obtido: 403
CENÁRIO: Dona da vaga lista candidaturas | Esperado: 200 | Obtido: 200
CENÁRIO: Dona atualiza status | Esperado: 200 | Obtido: 200
CENÁRIO: Estudante tenta alterar status | Esperado: 403 | Obtido: 403
  ✔ candidaturas são individuais e status fica sob controle da empresa dona (122.021793ms)
CENÁRIO: Tentativa excedente de login | Esperado: 429 | Obtido: 429
  ✔ limita tentativas de autenticação (43.59793ms)
✔ Fluxos de autenticação, permissões, vagas, perfil, notificações e candidaturas (6199.508043ms)
ℹ tests 9
ℹ suites 0
ℹ pass 9
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 9320.727231
```

## 6. Decisões tomadas

- Foi adotada a opção recomendada: `Candidatura` referencia `Usuario` estudante; o model `Candidato` foi removido. A unicidade é `@@unique([vagaId, usuarioId])`.
- A migration associa candidaturas antigas pelo e-mail normalizado a uma conta com papel `student`. Se não houver conta estudante correspondente, a candidatura antiga não é transportada. Em caso de mais de uma conta legada equivalente, usa-se o menor `id`; `INSERT OR IGNORE` preserva no máximo uma candidatura por par vaga/usuário.
- O painel inicial de seleção de papel foi removido, pois nunca era exibido. A seleção de papel já ocorre no formulário de cadastro.
- O acesso de leitura e escrita de notificações ficou restrito a empresas, em linha com o requisito de teste “notificações (somente empresa)”.
- A rota `GET /` explícita foi removida: `express.static` já entrega `public/index.html` para a raiz.
- A aplicação usa 10 tentativas por janela de 15 minutos, com limitadores independentes para login e registro.
- Playwright foi removido por não haver teste E2E existente; a suíte verificável é `node:test` na API.
- A migration de normalização converte papéis diferentes de `student` e `company` para `student`.

## 7. LIMITAÇÕES CONHECIDAS

- JWT é mantido em `localStorage`, portanto uma vulnerabilidade XSS pode expô-lo.
- O logout remove o token do navegador, mas não revoga tokens já emitidos.
- Não há recuperação de senha, upload de currículo ou paginação.
- SQLite foi mantido como banco de dados.
- Não há teste automatizado de navegador; a interface foi compilada e a aplicação foi iniciada/testada por HTTP.
- Notificações podem ser consultadas e gerenciadas pela API da empresa; a interface web lista notificações, mas não oferece formulários de criação/edição.
- Vagas legadas com `usuario_id` nulo podem ser visualizadas, mas não podem ser editadas por uma empresa.

## Verificação de instalação limpa e execução

Foi feito clone local do commit `7b57a4d`, seguido de `npm install`, cópia de `.env.example`, geração de `JWT_SECRET` com `openssl rand -hex 32`, `npm run setup`, `npm run typecheck`, `npm run build:front`, `npm test` e `npm run dev`.

Resultados observados no clone:

- `npm install`: concluído; auditoria informou zero vulnerabilidades.
- `npm run setup`: gerou o Prisma Client, aplicou seis migrations e concluiu o seed.
- `npm run seed` executado novamente: 2 usuários, 1 perfil, 3 vagas, 3 notificações e 0 candidaturas; 0 vagas sem dono e 0 perfis sem usuário.
- `npm run typecheck`, `npm run build:front` e `npm test`: concluídos; 9 testes passaram, 0 falharam.
- Servidor: `/health` retornou HTTP 200; `/` retornou HTTP 200 com HTML; rota API inexistente retornou JSON HTTP 404; `/api/perfil` sem token retornou JSON HTTP 401.
- Resposta HTTP incluiu `Content-Security-Policy`, `X-Content-Type-Options: nosniff` e `X-Frame-Options: SAMEORIGIN`.

Na cópia principal também foram executados `npm run build`, `npm audit --omit=dev` (zero vulnerabilidades) e inicialização com segredo curto e com o valor literal do exemplo; nos dois últimos casos o servidor encerrou com erro de configuração, como esperado.
