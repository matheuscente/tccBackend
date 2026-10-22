import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { requireRole } from "../../../middlewares/authorization/authorization.middleware"

export const adminRoutes = express.Router()

const adminController = container.adminController
const authentication = container.authenticationMiddleware

adminRoutes.use(authentication, requireRole("ADMIN"))

adminRoutes.get('/dashboard', adminController.dashboard)

adminRoutes.get('/users/:id/overview', RequestValidator.paramsValidator(FindByIdSchema), adminController.userOverview)
