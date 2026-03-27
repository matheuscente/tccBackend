import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { createStudySessionSchema } from "../validators/create-study-session.schema"
import { updateStudySessionSchema } from "../validators/update-study-session.schema"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { findAllByUserIdStudySessionSchema } from "../validators/findAllByuserId-study-session.schema"


export const studySessionRoutes = express.Router()

const studySessionController = container.studySessionController
const authentication = container.authenticationMiddleware

studySessionRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, studySessionController.findById)

studySessionRoutes.get('/user/:userId', RequestValidator.queryValidator(findAllByUserIdStudySessionSchema), authentication, studySessionController.findAllByUserId)

studySessionRoutes.post('/', RequestValidator.bodyValidator(createStudySessionSchema), authentication, studySessionController.create)

studySessionRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateStudySessionSchema), authentication, studySessionController.update)

studySessionRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, studySessionController.delete)