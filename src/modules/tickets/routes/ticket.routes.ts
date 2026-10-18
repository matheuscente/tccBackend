import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { imageUpload } from "../../../middlewares/upload.middleware"
import { addTicketMessageSchema, attachmentContentQuerySchema, createTicketSchema, listTicketsSchema, updateTicketStatusSchema } from "../validators/ticket.schema"

export const ticketRoutes = express.Router()

const controller = container.ticketController
const authentication = container.authenticationMiddleware
const byId = RequestValidator.paramsValidator(FindByIdSchema)

ticketRoutes.get('/', RequestValidator.queryValidator(listTicketsSchema), authentication, controller.findAll)

ticketRoutes.get('/id/:id', byId, authentication, controller.findById)

ticketRoutes.get('/attachments/:id/content', byId, RequestValidator.queryValidator(attachmentContentQuerySchema), controller.attachmentContent)

ticketRoutes.post('/', authentication, imageUpload.array("images", 5), RequestValidator.bodyValidator(createTicketSchema), controller.create)

ticketRoutes.post('/:id/messages', byId, authentication, imageUpload.array("images", 5), RequestValidator.bodyValidator(addTicketMessageSchema), controller.addMessage)

ticketRoutes.patch('/:id/status', byId, RequestValidator.bodyValidator(updateTicketStatusSchema), authentication, controller.updateStatus)
