import { Joi } from "celebrate"
import { uuidField } from "../../../shared/schemas/uuid-field.schema"

export const baseFileFields = {
    originalName: Joi.string().trim().min(1).max(200),

    token: Joi.string().max(2000),

    download: Joi.string().valid("1"),

    search: Joi.string().trim().max(100).allow(""),

    userId: uuidField("userId"),

    courseId: uuidField("courseId"),

    moduleId: uuidField("moduleId"),

    disciplineId: uuidField("disciplineId")
}
