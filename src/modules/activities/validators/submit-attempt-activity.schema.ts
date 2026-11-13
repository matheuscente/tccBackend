import { Joi } from "celebrate"
import { baseActivityFields } from "./base-activity.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const submitAttemptActivitySchema = Joi.object().keys({
    startedAt: baseActivityFields.startedAt,

    answers: baseActivityFields.answers
        .required()
        .messages({
            "any.required": ErrorMessages.required("respostas")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
