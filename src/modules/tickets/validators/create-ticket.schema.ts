import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const createTicketSchema = Joi.object().keys({
    subject: baseTicketFields.subject
        .required()
        .messages({
            "any.required": ErrorMessages.required("assunto")
        }),

    category: baseTicketFields.category
        .required()
        .messages({
            "any.required": ErrorMessages.required("categoria")
        }),

    message: baseTicketFields.message.required()

}).prefs({ abortEarly: false }).unknown(false).required()
