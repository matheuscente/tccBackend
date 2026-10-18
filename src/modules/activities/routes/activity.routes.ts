import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { userIdParamSchema } from "../../../shared/schemas/scope-fields.schema"
import { createActivitySchema, setActivityQuestionsSchema, submitAttemptSchema, updateActivitySchema } from "../validators/activity.schema"

export const activityRoutes = express.Router()

const controller = container.activityController
const authentication = container.authenticationMiddleware
const byId = RequestValidator.paramsValidator(FindByIdSchema)

activityRoutes.get('/id/:id', byId, authentication, controller.findById)

activityRoutes.get('/user/:userId', RequestValidator.paramsValidator(userIdParamSchema), authentication, controller.findAllByUserId)

activityRoutes.get('/attempts/:id', byId, authentication, controller.findAttemptById)

activityRoutes.post('/', RequestValidator.bodyValidator(createActivitySchema), authentication, controller.create)

activityRoutes.patch('/:id', byId, RequestValidator.bodyValidator(updateActivitySchema), authentication, controller.update)

activityRoutes.put('/:id/questions', byId, RequestValidator.bodyValidator(setActivityQuestionsSchema), authentication, controller.setQuestions)

activityRoutes.get('/:id/answer', byId, authentication, controller.getForAnswering)

activityRoutes.get('/:id/attempts', byId, authentication, controller.findAttempts)

activityRoutes.post('/:id/attempts', byId, RequestValidator.bodyValidator(submitAttemptSchema), authentication, controller.submitAttempt)

activityRoutes.delete('/:id', byId, authentication, controller.softDelete)
