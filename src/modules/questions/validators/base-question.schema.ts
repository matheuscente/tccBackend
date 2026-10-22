import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"
import { uuidField } from "../../../shared/schemas/uuid-field.schema"

const option = Joi.object({
    text: Joi.string().trim().min(1).max(500).required().messages({
        "any.required": ErrorMessages.required("texto da alternativa"),
        "string.empty": ErrorMessages.empty("texto da alternativa"),
        "string.max": ErrorMessages.max("texto da alternativa")
    }),
    isCorrect: Joi.boolean().required()
}).unknown(false)

export const baseQuestionFields = {
    statement: Joi.string()
        .trim()
        .min(5)
        .max(3000)
        .messages({
            "string.min": ErrorMessages.min("enunciado"),
            "string.max": ErrorMessages.max("enunciado"),
            "string.empty": ErrorMessages.empty("enunciado")
        }),

    type: Joi.string()
        .valid("MULTIPLE_CHOICE", "TRUE_FALSE")
        .messages({
            "any.only": ErrorMessages.predefinedValues("tipo")
        }),

    explanation: Joi.string()
        .trim()
        .max(3000)
        .allow(null, "")
        .messages({
            "string.max": ErrorMessages.max("explicação")
        }),

    options: Joi.array()
        .items(option)
        .min(2)
        .max(6)
        .messages({
            "array.min": "Informe pelo menos 2 alternativas.",
            "array.max": "Informe no máximo 6 alternativas."
        }),

    search: Joi.string().trim().max(100).allow(""),

    userId: uuidField("userId"),

    courseId: uuidField("courseId"),

    moduleId: uuidField("moduleId"),

    disciplineId: uuidField("disciplineId")
}
