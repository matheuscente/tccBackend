import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { createNoteSchema } from "../validators/create-note.schema"
import { updateNoteSchema } from "../validators/update-note.schema"
import { findAllByUserIdNoteSchema } from "../validators/findAllByUserId-note.schema"
import { filterNoteSchema } from "../validators/filter-note.schema"

export const noteRoutes = express.Router()

const noteController = container.noteController
const authentication = container.authenticationMiddleware

noteRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, noteController.findById)

noteRoutes.get('/user/:userId', RequestValidator.paramsValidator(findAllByUserIdNoteSchema), RequestValidator.queryValidator(filterNoteSchema), authentication, noteController.findAllByUserId)

noteRoutes.post('/', RequestValidator.bodyValidator(createNoteSchema), authentication, noteController.create)

noteRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateNoteSchema), authentication, noteController.update)

noteRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, noteController.softDelete)
