import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"
import { uuidField } from "../../../shared/schemas/uuid-field.schema"

export const baseStatsFields = {
    userId: uuidField("userId"),

    startDate: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .messages({
            "string.pattern.base": ErrorMessages.regex("data inicial", "dd/mm/aaaa")
        }),

    endDate: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .messages({
            "string.pattern.base": ErrorMessages.regex("data final", "dd/mm/aaaa")
        }),

    courseId: uuidField("courseId"),

    moduleId: uuidField("moduleId"),

    disciplineId: uuidField("disciplineId")
}
