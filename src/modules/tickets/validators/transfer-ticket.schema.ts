import { Joi } from "celebrate"
import { baseTicketFields } from "./base-ticket.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const transferTicketSchema = Joi.object().keys({
    adminId: baseTicketFields.adminId
        .required()
        .messages({
            "any.required": ErrorMessages.required("administrador")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
