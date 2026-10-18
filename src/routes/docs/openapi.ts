/**
 * Documentação OpenAPI (Swagger) da API.
 * Acesse em http://localhost:3000/api/v1/docs
 */
type Schema = Record<string, unknown>

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` })
const uuid = { type: "string", format: "uuid" }
const date = { type: "string", example: "25/12/2025", description: "dd/mm/aaaa" }
const scopeProps = { courseId: uuid, moduleId: uuid, disciplineId: uuid }

const ok = (schema: Schema, description = "Sucesso") => ({
    description,
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    statusCode: { type: "integer" },
                    state: { type: "string", example: "success" },
                    data: { type: "array", items: schema }
                }
            }
        }
    }
})

const errors = {
    400: { description: "Erro de validação", content: { "application/json": { schema: ref("Error") } } },
    401: { description: "Não autenticado", content: { "application/json": { schema: ref("Error") } } },
    403: { description: "Sem permissão", content: { "application/json": { schema: ref("Error") } } },
    404: { description: "Não encontrado", content: { "application/json": { schema: ref("Error") } } }
}

const body = (schema: Schema, contentType = "application/json") => ({
    required: true,
    content: { [contentType]: { schema } }
})

const idParam = { name: "id", in: "path", required: true, schema: uuid }
const userIdParam = { name: "userId", in: "path", required: true, schema: uuid }
const scopeQuery = [
    { name: "courseId", in: "query", schema: uuid },
    { name: "moduleId", in: "query", schema: uuid },
    { name: "disciplineId", in: "query", schema: uuid },
    { name: "search", in: "query", schema: { type: "string" } }
]

const secured = { security: [{ bearerAuth: [] }] }

/**
 * Gera as rotas CRUD padrão de um recurso (/id/:id, /user/:userId, POST /, PATCH /:id, DELETE /:id).
 */
const crud = (tag: string, entity: string, create: Schema, update: Schema, withScopeQuery = false) => ({
    [`/${tag}/id/{id}`]: {
        get: { tags: [tag], summary: `Busca ${entity} por id`, ...secured, parameters: [idParam], responses: { 200: ok(ref(entity)), ...errors } }
    },
    [`/${tag}/user/{userId}`]: {
        get: {
            tags: [tag], summary: `Lista ${entity} do usuário`, ...secured,
            parameters: [userIdParam, ...(withScopeQuery ? scopeQuery : [])],
            responses: { 200: ok(ref(entity)), ...errors }
        }
    },
    [`/${tag}`]: {
        post: { tags: [tag], summary: `Cria ${entity}`, ...secured, requestBody: body(create), responses: { 201: ok(ref(entity)), ...errors } }
    },
    [`/${tag}/{id}`]: {
        patch: { tags: [tag], summary: `Atualiza ${entity}`, ...secured, parameters: [idParam], requestBody: body(update), responses: { 200: ok(ref(entity)), ...errors } },
        delete: { tags: [tag], summary: `Remove ${entity}`, ...secured, parameters: [idParam], responses: { 204: { description: "Removido" }, ...errors } }
    }
})

const titled = (extra: Schema = {}) => ({
    type: "object",
    properties: { title: { type: "string" }, description: { type: "string", nullable: true }, ...extra }
})

export const openApiDocument = {
    openapi: "3.0.3",
    info: {
        title: "Organizador de Estudos - API",
        version: "1.0.0",
        description: "API do sistema online para organização de estudos (TCC). Todas as respostas seguem o formato { statusCode, state, data: [] }."
    },
    servers: [{ url: "/api/v1" }],
    components: {
        securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    statusCode: { type: "integer" },
                    state: { type: "string", example: "error" },
                    data: { type: "array", items: { type: "object", properties: { field: { type: "string" }, message: { type: "string" } } } }
                }
            },
            User: {
                type: "object",
                properties: { id: uuid, name: { type: "string" }, username: { type: "string" }, email: { type: "string" }, role: { type: "string", enum: ["ADMIN", "USER"] }, birthDate: { type: "string", format: "date-time" } }
            },
            Course: { type: "object", properties: { id: uuid, title: { type: "string" }, description: { type: "string", nullable: true } } },
            Module: { type: "object", properties: { id: uuid, courseId: uuid, title: { type: "string" }, description: { type: "string", nullable: true } } },
            Discipline: { type: "object", properties: { id: uuid, moduleId: uuid, title: { type: "string" }, description: { type: "string", nullable: true } } },
            Goal: {
                type: "object",
                properties: {
                    id: uuid, title: { type: "string" },
                    type: { type: "string", enum: ["DAILY_ONCE", "DAILY_RECURRING", "TOTAL_BY_DATE", "TOTAL_IN_PERIOD"] },
                    targetMinutes: { type: "integer" }, startDate: { type: "string" }, endDate: { type: "string", nullable: true }, ...scopeProps
                }
            },
            StudySession: {
                type: "object",
                properties: { id: uuid, minutes: { type: "integer" }, status: { type: "string", enum: ["IN_PROGRESS", "COMPLETED"] }, startedAt: { type: "string" }, studiedAt: { type: "string" }, ...scopeProps }
            },
            Question: {
                type: "object",
                properties: {
                    id: uuid, statement: { type: "string" }, type: { type: "string", enum: ["MULTIPLE_CHOICE", "TRUE_FALSE"] }, explanation: { type: "string", nullable: true },
                    options: { type: "array", items: { type: "object", properties: { id: uuid, text: { type: "string" }, isCorrect: { type: "boolean" } } } },
                    ...scopeProps
                }
            },
            Activity: {
                type: "object",
                properties: {
                    id: uuid, title: { type: "string" }, description: { type: "string", nullable: true }, questionCount: { type: "integer" },
                    attemptCount: { type: "integer" }, bestScore: { type: "number", nullable: true }, lastScore: { type: "number", nullable: true }, ...scopeProps
                }
            },
            Attempt: {
                type: "object",
                properties: { id: uuid, activityId: uuid, correctCount: { type: "integer" }, totalQuestions: { type: "integer" }, score: { type: "number" }, startedAt: { type: "string" }, finishedAt: { type: "string" } }
            },
            Note: { type: "object", properties: { id: uuid, title: { type: "string" }, content: { type: "string" }, ...scopeProps } },
            File: { type: "object", properties: { id: uuid, originalName: { type: "string" }, mimeType: { type: "string" }, size: { type: "integer" }, ...scopeProps } },
            Ticket: {
                type: "object",
                properties: {
                    id: uuid, subject: { type: "string" }, category: { type: "string", enum: ["DOUBT", "PROBLEM", "SUGGESTION"] },
                    status: { type: "string", enum: ["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"] }
                }
            }
        }
    },
    paths: {
        "/health": { get: { tags: ["health"], summary: "Verifica se a API está no ar", responses: { 200: { description: "OK" } } } },

        "/auth/login": {
            post: {
                tags: ["auth"], summary: "Login com nome de usuário ou e-mail",
                requestBody: body({ type: "object", properties: { username: { type: "string", description: "nome de usuário ou e-mail" }, password: { type: "string" } } }),
                responses: { 200: ok({ type: "object", properties: { accessToken: { type: "string" }, sessionExpiresAt: { type: "integer" } } }), ...errors }
            }
        },
        "/auth/refresh": { post: { tags: ["auth"], summary: "Renova o access token usando o cookie rToken", responses: { 200: { description: "Novo access token" }, ...errors } } },
        "/auth/logout": { delete: { tags: ["auth"], summary: "Encerra a sessão", ...secured, responses: { 204: { description: "Sessão encerrada" } } } },
        "/auth/forgot-password": {
            post: { tags: ["auth"], summary: "Envia o link de redefinição de senha", requestBody: body({ type: "object", properties: { email: { type: "string" } } }), responses: { 200: { description: "Resposta sempre igual" } } }
        },
        "/auth/reset-password": {
            post: { tags: ["auth"], summary: "Redefine a senha com o token recebido por e-mail", requestBody: body({ type: "object", properties: { token: { type: "string" }, newPassword: { type: "string" } } }), responses: { 200: { description: "Senha alterada" }, ...errors } }
        },

        "/users": {
            post: {
                tags: ["users"], summary: "Cadastro de usuário",
                requestBody: body({ type: "object", properties: { name: { type: "string" }, username: { type: "string" }, email: { type: "string" }, password: { type: "string" }, birthDate: date } }),
                responses: { 201: ok(ref("User")), ...errors }
            },
            get: {
                tags: ["users"], summary: "Lista usuários (admin)", ...secured,
                parameters: [{ name: "search", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }, { name: "pageSize", in: "query", schema: { type: "integer" } }],
                responses: { 200: { description: "Lista paginada" }, ...errors }
            }
        },
        "/users/me": { get: { tags: ["users"], summary: "Usuário autenticado", ...secured, responses: { 200: ok(ref("User")), ...errors } } },
        "/users/id/{id}": { get: { tags: ["users"], summary: "Busca usuário", ...secured, parameters: [idParam], responses: { 200: ok(ref("User")), ...errors } } },
        "/users/{id}": {
            patch: { tags: ["users"], summary: "Atualiza dados", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { name: { type: "string" }, username: { type: "string" }, email: { type: "string" }, birthDate: date } }), responses: { 200: ok(ref("User")), ...errors } },
            delete: { tags: ["users"], summary: "Desativa a conta (soft delete)", ...secured, parameters: [idParam], responses: { 204: { description: "Removido" }, ...errors } }
        },
        "/users/{id}/password": {
            patch: { tags: ["users"], summary: "Troca a senha", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { oldPassword: { type: "string" }, newPassword: { type: "string" } } }), responses: { 204: { description: "Senha alterada" }, ...errors } }
        },
        "/users/{id}/role": {
            patch: { tags: ["users"], summary: "Altera o perfil (admin)", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { role: { type: "string", enum: ["ADMIN", "USER"] } } }), responses: { 200: ok(ref("User")), ...errors } }
        },

        ...crud("courses", "Course", titled({ userId: uuid }), titled()),
        "/modules/course/{courseId}": { get: { tags: ["modules"], summary: "Módulos do curso", ...secured, parameters: [{ name: "courseId", in: "path", required: true, schema: uuid }], responses: { 200: ok(ref("Module")), ...errors } } },
        ...crud("modules", "Module", titled({ courseId: uuid }), titled()),
        "/disciplines/module/{moduleId}": { get: { tags: ["disciplines"], summary: "Disciplinas do módulo", ...secured, parameters: [{ name: "moduleId", in: "path", required: true, schema: uuid }], responses: { 200: ok(ref("Discipline")), ...errors } } },
        ...crud("disciplines", "Discipline", titled({ moduleId: uuid }), titled()),
        ...crud("goals", "Goal", ref("Goal"), { type: "object", properties: { title: { type: "string" }, targetMinutes: { type: "integer" }, endDate: date } }),

        "/study-sessions": { post: { tags: ["study-sessions"], summary: "Inicia o cronômetro de estudo", ...secured, requestBody: body({ type: "object", properties: scopeProps }), responses: { 201: ok(ref("StudySession")), ...errors } } },
        "/study-sessions/manual": { post: { tags: ["study-sessions"], summary: "Registra uma sessão concluída", ...secured, requestBody: body({ type: "object", properties: { minutes: { type: "integer" }, studiedAt: date, ...scopeProps } }), responses: { 201: ok(ref("StudySession")), ...errors } } },
        "/study-sessions/active": { get: { tags: ["study-sessions"], summary: "Sessão em andamento", ...secured, responses: { 200: ok(ref("StudySession")) } } },
        "/study-sessions/{id}/finish": { patch: { tags: ["study-sessions"], summary: "Finaliza o cronômetro", ...secured, parameters: [idParam], responses: { 200: ok(ref("StudySession")), ...errors } } },
        "/study-sessions/user/{userId}": { get: { tags: ["study-sessions"], summary: "Histórico de sessões", ...secured, parameters: [userIdParam], responses: { 200: ok(ref("StudySession")), ...errors } } },
        "/study-sessions/{id}": {
            patch: { tags: ["study-sessions"], summary: "Edita data/minutos de uma sessão concluída", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { minutes: { type: "integer" }, studiedAt: date } }), responses: { 200: ok(ref("StudySession")), ...errors } },
            delete: { tags: ["study-sessions"], summary: "Remove a sessão", ...secured, parameters: [idParam], responses: { 204: { description: "Removido" } } }
        },

        ...crud("questions", "Question", ref("Question"), { type: "object", properties: { statement: { type: "string" }, explanation: { type: "string" }, options: { type: "array", items: { type: "object" } } } }, true),

        ...crud("activities", "Activity", { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, questionIds: { type: "array", items: uuid }, ...scopeProps } }, titled()),
        "/activities/{id}/questions": { put: { tags: ["activities"], summary: "Define as questões da atividade (na ordem)", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { questionIds: { type: "array", items: uuid } } }), responses: { 200: ok(ref("Activity")), ...errors } } },
        "/activities/{id}/answer": { get: { tags: ["activities"], summary: "Questões para responder (sem gabarito)", ...secured, parameters: [idParam], responses: { 200: { description: "Atividade" }, ...errors } } },
        "/activities/{id}/attempts": {
            get: { tags: ["activities"], summary: "Tentativas da atividade", ...secured, parameters: [idParam], responses: { 200: ok(ref("Attempt")), ...errors } },
            post: { tags: ["activities"], summary: "Envia as respostas e corrige", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { startedAt: { type: "string", format: "date-time" }, answers: { type: "array", items: { type: "object", properties: { questionId: uuid, optionId: uuid } } } } }), responses: { 201: ok(ref("Attempt")), ...errors } }
        },
        "/activities/attempts/{id}": { get: { tags: ["activities"], summary: "Detalhe de uma tentativa com correção", ...secured, parameters: [idParam], responses: { 200: ok(ref("Attempt")), ...errors } } },

        ...crud("notes", "Note", { type: "object", properties: { title: { type: "string" }, content: { type: "string" }, ...scopeProps } }, { type: "object", properties: { title: { type: "string" }, content: { type: "string" } } }, true),

        "/files": {
            post: {
                tags: ["files"], summary: "Envia um arquivo (multipart, campo 'file')", ...secured,
                requestBody: body({ type: "object", properties: { file: { type: "string", format: "binary" }, ...scopeProps } }, "multipart/form-data"),
                responses: { 201: ok(ref("File")), ...errors }
            }
        },
        "/files/user/{userId}": { get: { tags: ["files"], summary: "Arquivos do usuário (somente o dono)", ...secured, parameters: [userIdParam, ...scopeQuery], responses: { 200: ok(ref("File")), ...errors } } },
        "/files/id/{id}": { get: { tags: ["files"], summary: "Metadados do arquivo", ...secured, parameters: [idParam], responses: { 200: ok(ref("File")), ...errors } } },
        "/files/{id}/access": { get: { tags: ["files"], summary: "Gera links temporários de visualização (streaming) e download", ...secured, parameters: [idParam], responses: { 200: { description: "viewUrl e downloadUrl" }, ...errors } } },
        "/files/{id}/content": { get: { tags: ["files"], summary: "Conteúdo do arquivo (suporta Range)", parameters: [idParam, { name: "token", in: "query", required: true, schema: { type: "string" } }, { name: "download", in: "query", schema: { type: "string", enum: ["1"] } }], responses: { 200: { description: "Arquivo" }, 206: { description: "Parte do arquivo" }, ...errors } } },
        "/files/{id}": {
            patch: { tags: ["files"], summary: "Renomeia ou move o arquivo", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { originalName: { type: "string" }, ...scopeProps } }), responses: { 200: ok(ref("File")), ...errors } },
            delete: { tags: ["files"], summary: "Remove o arquivo", ...secured, parameters: [idParam], responses: { 204: { description: "Removido" } } }
        },

        "/tickets": {
            get: { tags: ["tickets"], summary: "Lista chamados (usuário: os seus; admin: todos)", ...secured, parameters: [{ name: "status", in: "query", schema: { type: "string" } }, { name: "search", in: "query", schema: { type: "string" } }], responses: { 200: ok(ref("Ticket")), ...errors } },
            post: {
                tags: ["tickets"], summary: "Abre um chamado (multipart, até 5 imagens no campo 'images')", ...secured,
                requestBody: body({ type: "object", properties: { subject: { type: "string" }, category: { type: "string" }, message: { type: "string" }, images: { type: "array", items: { type: "string", format: "binary" } } } }, "multipart/form-data"),
                responses: { 201: ok(ref("Ticket")), ...errors }
            }
        },
        "/tickets/id/{id}": { get: { tags: ["tickets"], summary: "Chamado com mensagens", ...secured, parameters: [idParam], responses: { 200: ok(ref("Ticket")), ...errors } } },
        "/tickets/{id}/messages": { post: { tags: ["tickets"], summary: "Responde o chamado", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { message: { type: "string" }, images: { type: "array", items: { type: "string", format: "binary" } } } }, "multipart/form-data"), responses: { 201: ok(ref("Ticket")), ...errors } } },
        "/tickets/{id}/status": { patch: { tags: ["tickets"], summary: "Altera o status (usuário só pode encerrar)", ...secured, parameters: [idParam], requestBody: body({ type: "object", properties: { status: { type: "string" } } }), responses: { 200: ok(ref("Ticket")), ...errors } } },

        "/stats/summary": { get: { tags: ["stats"], summary: "Resumo de estudo no período (por dia e por escopo)", ...secured, parameters: [{ name: "userId", in: "query", schema: uuid }, { name: "startDate", in: "query", schema: date }, { name: "endDate", in: "query", schema: date }, ...scopeQuery.slice(0, 3)], responses: { 200: { description: "Resumo" }, ...errors } } },
        "/stats/goals": { get: { tags: ["stats"], summary: "Progresso das metas", ...secured, parameters: [{ name: "userId", in: "query", schema: uuid }], responses: { 200: { description: "Progresso" }, ...errors } } },
        "/stats/performance": { get: { tags: ["stats"], summary: "Rendimento nas atividades avaliativas", ...secured, parameters: [{ name: "userId", in: "query", schema: uuid }, { name: "startDate", in: "query", schema: date }, ...scopeQuery.slice(0, 3)], responses: { 200: { description: "Rendimento" }, ...errors } } },

        "/admin/dashboard": { get: { tags: ["admin"], summary: "Indicadores gerais do sistema", ...secured, responses: { 200: { description: "Painel" }, ...errors } } },
        "/admin/users/{id}/overview": { get: { tags: ["admin"], summary: "Visão geral de um usuário (sem acesso a arquivos e notas)", ...secured, parameters: [idParam], responses: { 200: { description: "Resumo do usuário" }, ...errors } } }
    }
}
