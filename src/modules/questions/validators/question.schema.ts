import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";
import { scopeFields } from "../../../shared/schemas/scope-fields.schema";

const option = Joi.object({
    text: Joi.string().trim().min(1).max(500).required().messages({
        "any.required": ErrorMessages.required("texto da alternativa"),
        "string.empty": ErrorMessages.empty("texto da alternativa"),
        "string.max": ErrorMessages.max("texto da alternativa")
    }),
    isCorrect: Joi.boolean().required()
}).unknown(false)

const statement = Joi.string().trim().min(5).max(3000).messages({
    "string.min": ErrorMessages.min("enunciado"),
    "string.max": ErrorMessages.max("enunciado"),
    "string.empty": ErrorMessages.empty("enunciado")
})

const explanation = Joi.string().trim().max(3000).allow(null, "").messages({
    "string.max": ErrorMessages.max("explicação")
})

const options = Joi.array().items(option).min(2).max(6).messages({
    "array.min": "Informe pelo menos 2 alternativas.",
    "array.max": "Informe no máximo 6 alternativas."
})

export const createQuestionSchema = Joi.object({
    statement: statement.required().messages({ "any.required": ErrorMessages.required("enunciado") }),
    type: Joi.string().valid("MULTIPLE_CHOICE", "TRUE_FALSE").required().messages({
        "any.only": ErrorMessages.predefinedValues("tipo"),
        "any.required": ErrorMessages.required("tipo")
    }),
    explanation,
    options: options.required().messages({ "any.required": ErrorMessages.required("alternativas") }),
    ...scopeFields
}).xor("courseId", "moduleId", "disciplineId")
    .messages({ "object.xor": "Informe exatamente um escopo: curso, módulo ou disciplina.", "object.missing": "Informe exatamente um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false).required()

export const updateQuestionSchema = Joi.object({
    statement,
    explanation,
    options
}).min(1).prefs({ abortEarly: false }).unknown(false).required()
