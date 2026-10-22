import { Joi } from "celebrate"
import { baseNoteFields } from "./base-note.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const createNoteSchema = Joi.object().keys({
    title: baseNoteFields.title
        .required()
        .messages({
            "any.required": ErrorMessages.required("título")
        }),

    content: baseNoteFields.content,

    courseId: baseNoteFields.courseId.allow(null),

    moduleId: baseNoteFields.moduleId.allow(null),

    disciplineId: baseNoteFields.disciplineId.allow(null)

}).oxor("courseId", "moduleId", "disciplineId")
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false).required()
