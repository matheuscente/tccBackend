import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const findAllByUserIdSchema = Joi.object().keys({
    userId: baseModuleFields.userId
    .required()
    .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false).required()