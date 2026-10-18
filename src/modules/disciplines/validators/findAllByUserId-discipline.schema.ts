import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdSchema = Joi.object().keys({
    userId: baseDisciplineFields.userId
    .required()
    .messages({
            "any.required": ErrorMessages.required("moduleId")
        })

}).prefs({ abortEarly: false }).unknown(false).required()