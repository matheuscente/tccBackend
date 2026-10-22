import { Joi } from "celebrate"
import { baseActivityFields } from "./base-activity.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdActivitySchema = Joi.object().keys({
    userId: baseActivityFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false)
