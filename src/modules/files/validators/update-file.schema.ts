import { Joi } from "celebrate"
import { baseFileFields } from "./base-file.schema"

export const updateFileSchema = Joi.object().keys({
    originalName: baseFileFields.originalName,

    courseId: baseFileFields.courseId.allow(null),

    moduleId: baseFileFields.moduleId.allow(null),

    disciplineId: baseFileFields.disciplineId.allow(null)

}).min(1).prefs({ abortEarly: false }).unknown(false).required()
