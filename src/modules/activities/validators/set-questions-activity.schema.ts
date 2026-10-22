import { Joi } from "celebrate"
import { baseActivityFields } from "./base-activity.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const setQuestionsActivitySchema = Joi.object().keys({
    questionIds: baseActivityFields.questionIds
        .required()
        .messages({
            "any.required": ErrorMessages.required("questões")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
