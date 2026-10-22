import { Joi } from "celebrate"
import { baseNoteFields } from "./base-note.schema"

export const updateNoteSchema = Joi.object().keys({
    title: baseNoteFields.title,

    content: baseNoteFields.content,

    courseId: baseNoteFields.courseId.allow(null),

    moduleId: baseNoteFields.moduleId.allow(null),

    disciplineId: baseNoteFields.disciplineId.allow(null)

}).min(1).prefs({ abortEarly: false }).unknown(false).required()
