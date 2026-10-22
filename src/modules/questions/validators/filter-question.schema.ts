import { Joi } from "celebrate"
import { baseQuestionFields } from "./base-question.schema"

export const filterQuestionSchema = Joi.object().keys({
    courseId: baseQuestionFields.courseId,

    moduleId: baseQuestionFields.moduleId,

    disciplineId: baseQuestionFields.disciplineId,

    search: baseQuestionFields.search

}).oxor("courseId", "moduleId", "disciplineId")
    .prefs({ abortEarly: false })
    .unknown(false)
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
