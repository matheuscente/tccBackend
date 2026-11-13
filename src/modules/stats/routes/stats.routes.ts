import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { statsQuerySchema } from "../validators/stats-query.schema"
import { statsUserQuerySchema } from "../validators/stats-user-query.schema"

export const statsRoutes = express.Router()

const statsController = container.statsController
const authentication = container.authenticationMiddleware

statsRoutes.get('/summary', RequestValidator.queryValidator(statsQuerySchema), authentication, statsController.summary)

statsRoutes.get('/goals', RequestValidator.queryValidator(statsUserQuerySchema), authentication, statsController.goals)

statsRoutes.get('/performance', RequestValidator.queryValidator(statsQuerySchema), authentication, statsController.performance)
