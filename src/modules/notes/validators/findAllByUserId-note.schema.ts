import { Joi } from "celebrate"
import { baseNoteFields } from "./base-note.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdNoteSchema = Joi.object().keys({
    userId: baseNoteFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false)
