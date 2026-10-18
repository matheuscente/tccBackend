# Organizador de Estudos — Backend

API REST do sistema online para organização de estudos (TCC).
Node.js + TypeScript + Express 5 + Prisma (PostgreSQL) + Celebrate/Joi + JWT + Bcrypt + Jest.

## Como rodar

```bash
npm install
cp .env.example .env        # ajuste DATABASE_URL, JWT_SECRET etc.
npx prisma generate
npx prisma migrate deploy   # aplica todas as migrations
npm run seed                # cria o administrador (ADMIN_USERNAME / ADMIN_PASSWORD do .env)
npm run dev                 # http://localhost:3000/api/v1
```

- Documentação Swagger: `http://localhost:3000/api/v1/docs`
- Health check: `GET /api/v1/health`
- Testes: `npm test` (usa o `.env.test`)
- Checagem de tipos: `npm run typecheck`

O Prisma usa `engineType = "client"` com o driver `@prisma/adapter-pg` (sem binário de query engine), por isso o `PrismaClient` é criado com `new PrismaPg(...)` em `src/lib/prisma.ts`.

## Arquitetura

Cada módulo em `src/modules/<módulo>` segue a mesma divisão:
`DTOs` → `interfaces` (controllers, repositories, services) → `repositories` (Prisma) → `services` (regras de negócio) → `controllers` → `routes` + `validators` (Celebrate/Joi).
As dependências são montadas em `src/app/container-dependencies.ts` e as rotas registradas em `src/routes/index/index.routes.ts`.

Todas as respostas seguem `{ statusCode, state: "success" | "error", data: [] }`.

| Módulo | Rotas (`/api/v1`) | Observações |
|---|---|---|
| auth | `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password` | Login por usuário **ou e-mail**. Refresh token em cookie httpOnly com rotação (o token anterior vale por 60 s para evitar corrida entre abas). |
| users | `/users`, `/users/me`, `/users/:id`, `/users/:id/password`, `/users/:id/role` | Cadastro com e-mail; listagem e troca de perfil só para ADMIN. |
| courses / modules / disciplines | `/courses`, `/modules`, `/disciplines` | Soft delete em cascata (inclui questões e atividades do escopo). |
| goals | `/goals` | Metas diárias, recorrentes, total até data e total no período. |
| study-sessions | `/study-sessions`, `/study-sessions/manual`, `/study-sessions/active` | Cronômetro (iniciar/finalizar) e registro manual. |
| stats | `/stats/summary`, `/stats/goals`, `/stats/performance` | Tempo por dia/escopo, progresso das metas e rendimento nas atividades. |
| questions | `/questions` | Banco de questões (múltipla escolha e verdadeiro/falso). |
| activities | `/activities`, `/activities/:id/questions`, `/activities/:id/answer`, `/activities/:id/attempts` | Atividades avaliativas por curso/módulo/disciplina, correção automática. |
| notes | `/notes` | Bloco de notas — **privado** (nem o admin acessa). |
| files | `/files`, `/files/:id/access`, `/files/:id/content` | Upload, download e streaming (Range). **Privado**. Backblaze B2 (API S3) ou disco local. |
| tickets | `/tickets`, `/tickets/:id/messages`, `/tickets/:id/status` | SAC com anexos de imagem; admin responde pelo painel. |
| admin | `/admin/dashboard`, `/admin/users/:id/overview` | Indicadores gerais e acompanhamento por usuário. |

### Arquivos (Backblaze B2)
Preencha `B2_ENDPOINT`, `B2_REGION`, `B2_BUCKET`, `B2_KEY_ID` e `B2_APPLICATION_KEY` no `.env`.
Sem essas variáveis os arquivos ficam na pasta `STORAGE_LOCAL_DIR` (padrão `uploads/`).
Como `<video>`/`<img>` não enviam o header Authorization, a rota `/files/:id/access` gera links temporários (30 min) assinados.

### E-mail (esqueci a senha)
Com `SMTP_HOST` configurado o link é enviado por e-mail (nodemailer). Sem SMTP, o e-mail é exibido no console do backend (modo desenvolvimento).
