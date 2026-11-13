import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { createQuestionSchema } from "../validators/create-question.schema"
import { updateQuestionSchema } from "../validators/update-question.schema"
import { findAllByUserIdQuestionSchema } from "../validators/findAllByUserId-question.schema"
import { filterQuestionSchema } from "../validators/filter-question.schema"

export const questionRoutes = express.Router()

const questionController = container.questionController
const authentication = container.authenticationMiddleware

questionRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, questionController.findById)

questionRoutes.get('/user/:userId', RequestValidator.paramsValidator(findAllByUserIdQuestionSchema), RequestValidator.queryValidator(filterQuestionSchema), authentication, questionController.findAllByUserId)

questionRoutes.post('/', RequestValidator.bodyValidator(createQuestionSchema), authentication, questionController.create)

questionRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateQuestionSchema), authentication, questionController.update)

questionRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, questionController.softDelete)
