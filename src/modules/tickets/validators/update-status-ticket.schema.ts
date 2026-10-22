import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const updateStatusTicketSchema = Joi.object().keys({
    status: baseTicketFields.status
        .required()
        .messages({
            "any.required": ErrorMessages.required("status")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
