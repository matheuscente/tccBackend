import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"

export const createStudySessionSchema = Joi.object().keys({

    userId: baseStudySessionFields.userId,

    courseId: baseStudySessionFields.courseId,

    moduleId: baseStudySessionFields.moduleId,

    disciplineId: baseStudySessionFields.disciplineId

}).xor('courseId', 'moduleId', 'disciplineId').prefs({ abortEarly: false }).unknown(false).required().messages({
    "object.xor": "É permitido o id de somente 1 escopo.",
    "object.missing": "Informe o escopo da sessão: curso, módulo ou disciplina."
})
