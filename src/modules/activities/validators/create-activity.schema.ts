import { Joi } from "celebrate"
import { baseActivityFields } from "./base-activity.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const createActivitySchema = Joi.object().keys({
    title: baseActivityFields.title
        .required()
        .messages({
            "any.required": ErrorMessages.required("título")
        }),

    description: baseActivityFields.description,

    questionIds: baseActivityFields.questionIds,

    userId: baseActivityFields.userId,

    courseId: baseActivityFields.courseId,

    moduleId: baseActivityFields.moduleId,

    disciplineId: baseActivityFields.disciplineId

}).xor("courseId", "moduleId", "disciplineId")
    .messages({
        "object.xor": "Informe exatamente um escopo: curso, módulo ou disciplina.",
        "object.missing": "Informe exatamente um escopo: curso, módulo ou disciplina."
    })
    .prefs({ abortEarly: false }).unknown(false).required()
