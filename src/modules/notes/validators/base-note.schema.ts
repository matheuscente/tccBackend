import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"
import { uuidField } from "../../../shared/schemas/uuid-field.schema"

export const baseNoteFields = {
    title: Joi.string()
        .trim()
        .min(1)
        .max(150)
        .messages({
            "string.max": ErrorMessages.max("título"),
            "string.empty": ErrorMessages.empty("título")
        }),

    content: Joi.string()
        .max(100000)
        .allow("")
        .messages({
            "string.max": "A nota pode ter no máximo 100.000 caracteres."
        }),

    search: Joi.string().trim().max(100).allow(""),

    userId: uuidField("userId"),

    courseId: uuidField("courseId"),

    moduleId: uuidField("moduleId"),

    disciplineId: uuidField("disciplineId")
}
