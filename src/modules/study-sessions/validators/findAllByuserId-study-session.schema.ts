import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const findAllByUserIdStudySessionSchema = Joi.object().keys({
    userId: baseStudySessionFields.userId
    .required()
    .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false).required()