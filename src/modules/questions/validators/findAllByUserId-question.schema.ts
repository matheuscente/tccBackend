import { Joi } from "celebrate"
import { baseQuestionFields } from "./base-question.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdQuestionSchema = Joi.object().keys({
    userId: baseQuestionFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false)
