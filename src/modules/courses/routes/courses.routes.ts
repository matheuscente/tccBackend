import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { createCourseSchema } from "../validators/create-course.schema"
import { updateCourseSchema } from "../validators/update-course.schema"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema.ts"
import { findAllByUserIdSchema } from "../validators/findAllByUserId.schema"


export const courseRoutes = express.Router()

const courseController = container.courseController
const authentication = container.authenticationMiddleware

courseRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, courseController.findById)

courseRoutes.get('/', RequestValidator.queryValidator(findAllByUserIdSchema), authentication, courseController.findAllByUserId)

courseRoutes.post('/', RequestValidator.bodyValidator(createCourseSchema), authentication, courseController.create)

courseRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateCourseSchema), authentication, courseController.update)

courseRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, courseController.softDelete)