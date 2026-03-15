import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { createModuleSchema } from "../validators/create-module.schema"
import { updateModuleSchema } from "../validators/update-module.schema"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { findAllByUserIdSchema } from "../validators/findAllByUserId-module.schema"
import { findAllByCourseIdSchema } from "../validators/findAllByCourseId-module.schema"


export const moduleRoutes = express.Router()

const moduleController = container.moduleController
const authentication = container.authenticationMiddleware

moduleRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, moduleController.findById)

moduleRoutes.get('/user/:userId', RequestValidator.queryValidator(findAllByUserIdSchema), authentication, moduleController.findAllByUserId)

moduleRoutes.get('/course/:courseId', RequestValidator.queryValidator(findAllByCourseIdSchema), authentication, moduleController.findAllByCourseId)

moduleRoutes.post('/', RequestValidator.bodyValidator(createModuleSchema), authentication, moduleController.create)

moduleRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateModuleSchema), authentication, moduleController.update)

moduleRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, moduleController.softDelete)