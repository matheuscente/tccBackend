import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

const message = Joi.string().trim().min(2).max(5000).messages({
    "string.min": ErrorMessages.min("mensagem"),
    "string.max": ErrorMessages.max("mensagem"),
    "string.empty": ErrorMessages.empty("mensagem"),
    "any.required": ErrorMessages.required("mensagem")
})

const status = Joi.string().valid("OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED").messages({
    "any.only": ErrorMessages.predefinedValues("status")
})

export const createTicketSchema = Joi.object({
    subject: Joi.string().trim().min(5).max(150).required().messages({
        "string.min": ErrorMessages.min("assunto"),
        "string.max": ErrorMessages.max("assunto"),
        "string.empty": ErrorMessages.empty("assunto"),
        "any.required": ErrorMessages.required("assunto")
    }),
    category: Joi.string().valid("DOUBT", "PROBLEM", "SUGGESTION").required().messages({
        "any.only": ErrorMessages.predefinedValues("categoria"),
        "any.required": ErrorMessages.required("categoria")
    }),
    message: message.required()
}).prefs({ abortEarly: false }).unknown(false).required()

export const addTicketMessageSchema = Joi.object({
    message: message.required()
}).prefs({ abortEarly: false }).unknown(false).required()

export const updateTicketStatusSchema = Joi.object({
    status: status.required().messages({ "any.required": ErrorMessages.required("status") })
}).prefs({ abortEarly: false }).unknown(false).required()

export const listTicketsSchema = Joi.object({
    status,
    search: Joi.string().trim().max(100).allow("")
}).prefs({ abortEarly: false }).unknown(false)

export const attachmentContentQuerySchema = Joi.object({
    token: Joi.string().max(2000).required(),
    download: Joi.string().valid("1")
}).prefs({ abortEarly: false }).unknown(false)
