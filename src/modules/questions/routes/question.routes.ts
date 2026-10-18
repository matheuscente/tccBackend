import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { scopeQuerySchema, userIdParamSchema } from "../../../shared/schemas/scope-fields.schema"
import { createQuestionSchema, updateQuestionSchema } from "../validators/question.schema"

export const questionRoutes = express.Router()

const controller = container.questionController
const authentication = container.authenticationMiddleware

questionRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, controller.findById)

questionRoutes.get('/user/:userId', RequestValidator.paramsValidator(userIdParamSchema), RequestValidator.queryValidator(scopeQuerySchema), authentication, controller.findAllByUserId)

questionRoutes.post('/', RequestValidator.bodyValidator(createQuestionSchema), authentication, controller.create)

questionRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateQuestionSchema), authentication, controller.update)

questionRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, controller.softDelete)
