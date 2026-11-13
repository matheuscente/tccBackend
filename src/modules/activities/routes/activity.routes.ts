import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { createActivitySchema } from "../validators/create-activity.schema"
import { updateActivitySchema } from "../validators/update-activity.schema"
import { setQuestionsActivitySchema } from "../validators/set-questions-activity.schema"
import { submitAttemptActivitySchema } from "../validators/submit-attempt-activity.schema"
import { findAllByUserIdActivitySchema } from "../validators/findAllByUserId-activity.schema"

export const activityRoutes = express.Router()

const activityController = container.activityController
const authentication = container.authenticationMiddleware

activityRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, activityController.findById)

activityRoutes.get('/user/:userId', RequestValidator.paramsValidator(findAllByUserIdActivitySchema), authentication, activityController.findAllByUserId)

activityRoutes.get('/attempts/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, activityController.findAttemptById)

activityRoutes.post('/', RequestValidator.bodyValidator(createActivitySchema), authentication, activityController.create)

activityRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateActivitySchema), authentication, activityController.update)

activityRoutes.put('/:id/questions', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(setQuestionsActivitySchema), authentication, activityController.setQuestions)

activityRoutes.get('/:id/answer', RequestValidator.paramsValidator(FindByIdSchema), authentication, activityController.getForAnswering)

activityRoutes.get('/:id/attempts', RequestValidator.paramsValidator(FindByIdSchema), authentication, activityController.findAttempts)

activityRoutes.post('/:id/attempts', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(submitAttemptActivitySchema), authentication, activityController.submitAttempt)

activityRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, activityController.softDelete)
