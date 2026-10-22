import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"

export const attachmentContentTicketSchema = Joi.object().keys({
    token: baseTicketFields.token.required(),

    download: baseTicketFields.download

}).prefs({ abortEarly: false }).unknown(false)
