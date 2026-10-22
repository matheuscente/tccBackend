import { Joi } from "celebrate"
import { baseQuestionFields } from "./base-question.schema"

export const updateQuestionSchema = Joi.object().keys({
    statement: baseQuestionFields.statement,

    explanation: baseQuestionFields.explanation,

    options: baseQuestionFields.options

}).min(1).prefs({ abortEarly: false }).unknown(false).required()
