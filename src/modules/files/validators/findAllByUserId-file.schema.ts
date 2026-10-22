import { Joi } from "celebrate"
import { baseFileFields } from "./base-file.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdFileSchema = Joi.object().keys({
    userId: baseFileFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false)
