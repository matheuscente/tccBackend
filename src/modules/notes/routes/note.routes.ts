import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { scopeQuerySchema, userIdParamSchema } from "../../../shared/schemas/scope-fields.schema"
import { createNoteSchema, updateNoteSchema } from "../validators/note.schema"

export const noteRoutes = express.Router()

const controller = container.noteController
const authentication = container.authenticationMiddleware
const byId = RequestValidator.paramsValidator(FindByIdSchema)

noteRoutes.get('/id/:id', byId, authentication, controller.findById)

noteRoutes.get('/user/:userId', RequestValidator.paramsValidator(userIdParamSchema), RequestValidator.queryValidator(scopeQuerySchema), authentication, controller.findAllByUserId)

noteRoutes.post('/', RequestValidator.bodyValidator(createNoteSchema), authentication, controller.create)

noteRoutes.patch('/:id', byId, RequestValidator.bodyValidator(updateNoteSchema), authentication, controller.update)

noteRoutes.delete('/:id', byId, authentication, controller.softDelete)
