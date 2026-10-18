import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { requireRole } from "../../../middlewares/authorization/authorization.middleware"

export const adminRoutes = express.Router()

const controller = container.adminController

// todas as rotas do painel exigem usuário autenticado com perfil ADMIN
adminRoutes.use(container.authenticationMiddleware, requireRole("ADMIN"))

adminRoutes.get('/dashboard', controller.dashboard)

adminRoutes.get('/users/:id/overview', RequestValidator.paramsValidator(FindByIdSchema), controller.userOverview)
