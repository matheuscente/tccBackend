import { Joi } from "celebrate"
import { baseNoteFields } from "./base-note.schema"

export const filterNoteSchema = Joi.object().keys({
    courseId: baseNoteFields.courseId,

    moduleId: baseNoteFields.moduleId,

    disciplineId: baseNoteFields.disciplineId,

    search: baseNoteFields.search

}).oxor("courseId", "moduleId", "disciplineId")
    .prefs({ abortEarly: false })
    .unknown(false)
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
