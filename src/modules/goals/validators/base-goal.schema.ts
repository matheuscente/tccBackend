import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const baseGoalFields = {
    title: Joi.string()
        .min(3)
        .max(100)
        .messages({
                    "string.min": ErrorMessages.min("título"),
                    "string.max": ErrorMessages.max("título"),
                    "string.empty": ErrorMessages.empty("título"),
                    "string.base": ErrorMessages.type("título", "um texto")
                }),

    type: Joi.string()
        .valid("DAILY_ONCE", "DAILY_RECURRING", "TOTAL_BY_DATE", "TOTAL_IN_PERIOD")
        .messages({
            "any.only": ErrorMessages.predefinedValues("tipo")
        }),

    targetMinutes: Joi.number()
        .integer()
        .min(1)
        .max(2628000)
        .messages({
            "number.min": ErrorMessages.minNumber("tempo da meta", "1 minuto"),
            "number.max": ErrorMessages.maxNumber("tempo da meta", "2 anos"),
            "number.base": ErrorMessages.type("tempo da meta", "um inteiro"),
            "number.interger": ErrorMessages.type("tempo da meta", "um inteiro")
        }),

    startDate: Joi.string()
         .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
         .messages({
            "string.empty": ErrorMessages.empty("Data de início"),
            "string.base": ErrorMessages.type("Data de início", "um texto"),
            "string.pattern.base": ErrorMessages.regex("Data de início", "dd/mm/aaaa")
         }),

    endDate: Joi.string()
         .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .allow(null)
        .messages({
            "string.empty": ErrorMessages.empty("Data de término"),
            "string.base": ErrorMessages.type("Data de término", "um texto"),
            "string.pattern.base": ErrorMessages.regex("Data de término", "dd/mm/aaaa")
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
         })
        ,
        
    moduleId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("moduleId"),
            "string.base": ErrorMessages.type("moduleId", "um texto")
         })
        ,
        
    disciplineId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("disciplineId"),
            "string.base": ErrorMessages.type("disciplineId", "um texto")
         })
        ,
        
    goalId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("goalId"),
            "string.base": ErrorMessages.type("goalId", "um texto")
         })
        
}