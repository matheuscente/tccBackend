import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { createDisciplineSchema } from "../validators/create-discipline.schema"
import { updateDisciplineSchema } from "../validators/update-discipline.schema"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { findAllByUserIdSchema } from "../validators/findAllByUserId-discipline.schema"
import { findAllByModuleIdSchema } from "../validators/findAllByModuleId-discipline.schema"


export const disciplineRoutes = express.Router()

const disciplineController = container.disciplineController
const authentication = container.authenticationMiddleware

disciplineRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, disciplineController.findById)

disciplineRoutes.get('/user/:userId', RequestValidator.queryValidator(findAllByUserIdSchema), authentication, disciplineController.findAllByUserId)

disciplineRoutes.get('/module/:moduleId', RequestValidator.queryValidator(findAllByModuleIdSchema), authentication, disciplineController.findAllByModuleId)

disciplineRoutes.post('/', RequestValidator.bodyValidator(createDisciplineSchema), authentication, disciplineController.create)

disciplineRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateDisciplineSchema), authentication, disciplineController.update)

disciplineRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, disciplineController.softDelete)