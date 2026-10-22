import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"

export const filterTicketSchema = Joi.object().keys({
    status: baseTicketFields.status,

    search: baseTicketFields.search

}).prefs({ abortEarly: false }).unknown(false)
