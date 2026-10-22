import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const baseTicketFields = {
    subject: Joi.string()
        .trim()
        .min(5)
        .max(150)
        .messages({
            "string.min": ErrorMessages.min("assunto"),
            "string.max": ErrorMessages.max("assunto"),
            "string.empty": ErrorMessages.empty("assunto")
        }),

    category: Joi.string()
        .valid("DOUBT", "PROBLEM", "SUGGESTION")
        .messages({
            "any.only": ErrorMessages.predefinedValues("categoria")
        }),

    message: Joi.string()
        .trim()
        .min(2)
        .max(5000)
        .messages({
            "string.min": ErrorMessages.min("mensagem"),
            "string.max": ErrorMessages.max("mensagem"),
            "string.empty": ErrorMessages.empty("mensagem"),
            "any.required": ErrorMessages.required("mensagem")
        }),

    status: Joi.string()
        .valid("OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED")
        .messages({
            "any.only": ErrorMessages.predefinedValues("status")
        }),

    search: Joi.string().trim().max(100).allow(""),

    token: Joi.string().max(2000),

    download: Joi.string().valid("1")
}
