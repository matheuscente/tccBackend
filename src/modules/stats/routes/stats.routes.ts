import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { statsQuerySchema, statsUserQuerySchema } from "../validators/stats.schema"

export const statsRoutes = express.Router()

const controller = container.statsController
const authentication = container.authenticationMiddleware

statsRoutes.get('/summary', RequestValidator.queryValidator(statsQuerySchema), authentication, controller.summary)

statsRoutes.get('/goals', RequestValidator.queryValidator(statsUserQuerySchema), authentication, controller.goals)

statsRoutes.get('/performance', RequestValidator.queryValidator(statsQuerySchema), authentication, controller.performance)
