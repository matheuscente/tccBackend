import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"

export const addMessageTicketSchema = Joi.object().keys({
    message: baseTicketFields.message.required(),

    keepInProgress: baseTicketFields.keepInProgress

}).prefs({ abortEarly: false }).unknown(false).required()
