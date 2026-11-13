import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const baseModuleFields = {
    title: Joi.string()
        .min(3)
        .max(100)
         .messages({
                    "string.min": ErrorMessages.min("título"),
                    "string.max": ErrorMessages.max("título"),
                    "string.empty": ErrorMessages.empty("título"),
                    "string.base": ErrorMessages.type("título", "um texto"),
        
                }),

    description: Joi.string()
        .min(3)
        .max(500)
        .messages({
            "string.min": ErrorMessages.min("descrição"),
            "string.max": ErrorMessages.max("descrição"),
            "string.empty": ErrorMessages.empty("descrição"),
            "string.base": ErrorMessages.type("descrição", "um texto"),
        }),

    courseId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("courseId"),
            "string.base": ErrorMessages.type("courseId", "um texto"),
        }),

    userId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("userId"),
            "string.base": ErrorMessages.type("userId", "um texto"),
        }),

    moduleId: Joi.string()
        .uuid({ version: "uuidv4" })
        .messages({
            "string.empty": ErrorMessages.empty("moduleId"),
            "string.base": ErrorMessages.type("moduleId", "um texto"),
        })
}