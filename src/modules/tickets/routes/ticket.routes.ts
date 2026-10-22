import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { imageUpload } from "../../../middlewares/upload.middleware"
import { createTicketSchema } from "../validators/create-ticket.schema"
import { addMessageTicketSchema } from "../validators/add-message-ticket.schema"
import { updateStatusTicketSchema } from "../validators/update-status-ticket.schema"
import { filterTicketSchema } from "../validators/filter-ticket.schema"
import { attachmentContentTicketSchema } from "../validators/attachment-content-ticket.schema"

export const ticketRoutes = express.Router()

const ticketController = container.ticketController
const authentication = container.authenticationMiddleware

ticketRoutes.get('/', RequestValidator.queryValidator(filterTicketSchema), authentication, ticketController.findAll)

ticketRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, ticketController.findById)

ticketRoutes.get('/attachments/:id/content', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.queryValidator(attachmentContentTicketSchema), ticketController.attachmentContent)

ticketRoutes.post('/', authentication, imageUpload.array("images", 5), RequestValidator.bodyValidator(createTicketSchema), ticketController.create)

ticketRoutes.post('/:id/messages', RequestValidator.paramsValidator(FindByIdSchema), authentication, imageUpload.array("images", 5), RequestValidator.bodyValidator(addMessageTicketSchema), ticketController.addMessage)

ticketRoutes.patch('/:id/status', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateStatusTicketSchema), authentication, ticketController.updateStatus)
