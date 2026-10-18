import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const baseStudySessionFields = {
    minutes: Joi.number()
        .integer()
        .min(1)
        .messages({
            "number.min": ErrorMessages.minNumber("minutos", "1 minuto"),
            "number.base": ErrorMessages.type("minutos", "um inteiro"),
            "number.interger": ErrorMessages.type("minutos", "um inteiro")
        }),
        
    studiedAt: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .messages({
            "string.empty": ErrorMessages.empty("Estudado em"),
            "string.base": ErrorMessages.type("Estudado em", "um texto"),
            "string.pattern.base": ErrorMessages.regex("Estudado em", "dd/mm/aaaa")
                 }),

    userId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("userId"),
            "string.base": ErrorMessages.type("userId", "um texto")
         }),

    courseId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("courseId"),
            "string.base": ErrorMessages.type("courseId", "um texto")
         }),

    moduleId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("moduleId"),
            "string.base": ErrorMessages.type("moduleId", "um texto")
         }),

    disciplineId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("disciplineId"),
            "string.base": ErrorMessages.type("disciplineId", "um texto")
         }),

    studySessionId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("studySessionId"),
            "string.base": ErrorMessages.type("studySessionId", "um texto")
         })
}