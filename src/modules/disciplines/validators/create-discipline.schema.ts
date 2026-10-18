import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const createDisciplineSchema = Joi.object().keys({
    title: baseDisciplineFields.title
    .required()
    .messages({
        "any.required": ErrorMessages.required("título")
    }),

    description: baseDisciplineFields.description,

    moduleId: baseDisciplineFields.moduleId
    .required()
    .messages({
        "any.required": ErrorMessages.required("moduleId")
    })

}).prefs({ abortEarly: false }).unknown(false).required()