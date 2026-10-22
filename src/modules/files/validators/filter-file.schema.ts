import { Joi } from "celebrate"
import { baseFileFields } from "./base-file.schema"

export const filterFileSchema = Joi.object().keys({
    courseId: baseFileFields.courseId,

    moduleId: baseFileFields.moduleId,

    disciplineId: baseFileFields.disciplineId,

    search: baseFileFields.search

}).oxor("courseId", "moduleId", "disciplineId")
    .prefs({ abortEarly: false })
    .unknown(false)
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
