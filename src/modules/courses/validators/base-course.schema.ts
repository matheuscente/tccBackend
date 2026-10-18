import { Joi } from "celebrate"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const baseCourseFields = {
    title: Joi.string()
        .min(5)
        .max(100)
        .messages({
            "string.min": ErrorMessages.min("título"),
            "string.max": ErrorMessages.min("título"),
            "string.empty": ErrorMessages.empty("título"),
            "string.base": ErrorMessages.type("título", "um texto"),

        })
        ,

    description: Joi.string()
        .min(5)
        .max(500)
        .messages({
            "string.min": ErrorMessages.min("descrição"),
            "string.max": ErrorMessages.min("descrição"),
            "string.empty": ErrorMessages.empty("descrição"),
            "string.base": ErrorMessages.type("descrição", "um texto"),
        }),

    userId: Joi.string()
    .uuid({ version: "uuidv4" })
    .messages({
        "string.empty": ErrorMessages.empty("userId"),
        "string.base": ErrorMessages.type("userId", "um texto"),
    })
}