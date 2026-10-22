import { Joi } from "celebrate"
import { baseQuestionFields } from "./base-question.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const createQuestionSchema = Joi.object().keys({
    statement: baseQuestionFields.statement
        .required()
        .messages({
            "any.required": ErrorMessages.required("enunciado")
        }),

    type: baseQuestionFields.type
        .required()
        .messages({
            "any.required": ErrorMessages.required("tipo")
        }),

    explanation: baseQuestionFields.explanation,

    options: baseQuestionFields.options
        .required()
        .messages({
            "any.required": ErrorMessages.required("alternativas")
        }),

    userId: baseQuestionFields.userId,

    courseId: baseQuestionFields.courseId.allow(null),

    moduleId: baseQuestionFields.moduleId.allow(null),

    disciplineId: baseQuestionFields.disciplineId.allow(null)

}).xor("courseId", "moduleId", "disciplineId")
    .messages({
        "object.xor": "Informe exatamente um escopo: curso, módulo ou disciplina.",
        "object.missing": "Informe exatamente um escopo: curso, módulo ou disciplina."
    })
    .prefs({ abortEarly: false }).unknown(false).required()
