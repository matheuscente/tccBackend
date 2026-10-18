import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";
import { scopeFields, uuidParam } from "../../../shared/schemas/scope-fields.schema";

const title = Joi.string().trim().min(3).max(150).messages({
    "string.min": ErrorMessages.min("título"),
    "string.max": ErrorMessages.max("título"),
    "string.empty": ErrorMessages.empty("título")
})

const description = Joi.string().trim().max(1000).allow(null, "").messages({
    "string.max": ErrorMessages.max("descrição")
})

const questionIds = Joi.array().items(uuidParam("questionId")).max(100).unique().messages({
    "array.unique": "Há questões repetidas na atividade.",
    "array.max": "Uma atividade pode ter no máximo 100 questões."
})

export const createActivitySchema = Joi.object({
    title: title.required().messages({ "any.required": ErrorMessages.required("título") }),
    description,
    questionIds,
    ...scopeFields
}).xor("courseId", "moduleId", "disciplineId")
    .messages({ "object.xor": "Informe exatamente um escopo: curso, módulo ou disciplina.", "object.missing": "Informe exatamente um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false).required()

export const updateActivitySchema = Joi.object({
    title,
    description
}).min(1).prefs({ abortEarly: false }).unknown(false).required()

export const setActivityQuestionsSchema = Joi.object({
    questionIds: questionIds.required().messages({ "any.required": ErrorMessages.required("questões") })
}).prefs({ abortEarly: false }).unknown(false).required()

export const submitAttemptSchema = Joi.object({
    startedAt: Joi.string().isoDate(),
    answers: Joi.array().items(Joi.object({
        questionId: uuidParam("questionId").required(),
        optionId: uuidParam("optionId").allow(null).required()
    })).max(100).required().messages({ "any.required": ErrorMessages.required("respostas") })
}).prefs({ abortEarly: false }).unknown(false).required()
