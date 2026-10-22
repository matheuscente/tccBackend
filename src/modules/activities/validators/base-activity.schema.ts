import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"
import { uuidField } from "../../../shared/schemas/uuid-field.schema"

export const baseActivityFields = {
    title: Joi.string()
        .trim()
        .min(3)
        .max(150)
        .messages({
            "string.min": ErrorMessages.min("título"),
            "string.max": ErrorMessages.max("título"),
            "string.empty": ErrorMessages.empty("título")
        }),

    description: Joi.string()
        .trim()
        .max(1000)
        .allow(null, "")
        .messages({
            "string.max": ErrorMessages.max("descrição")
        }),

    questionIds: Joi.array()
        .items(uuidField("questionId"))
        .max(100)
        .unique()
        .messages({
            "array.unique": "Há questões repetidas na atividade.",
            "array.max": "Uma atividade pode ter no máximo 100 questões."
        }),

    startedAt: Joi.string().isoDate(),

    answers: Joi.array()
        .items(Joi.object({
            questionId: uuidField("questionId").required(),
            optionId: uuidField("optionId").allow(null).required()
        }))
        .max(100),

    userId: uuidField("userId"),

    courseId: uuidField("courseId").allow(null),

    moduleId: uuidField("moduleId").allow(null),

    disciplineId: uuidField("disciplineId").allow(null)
}
