import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"

export const addMessageTicketSchema = Joi.object().keys({
    message: baseTicketFields.message.required()

}).prefs({ abortEarly: false }).unknown(false).required()
