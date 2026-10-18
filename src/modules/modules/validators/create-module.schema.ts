import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const createModuleSchema = Joi.object().keys({
    title: baseModuleFields.title
    .required()
    .messages({
        "any.required": ErrorMessages.required("título")
    }),

    description: baseModuleFields.description,

    courseId: baseModuleFields.courseId
    .required()
    .messages({
        "any.required": ErrorMessages.required("courseId")
    })

}).prefs({ abortEarly: false }).unknown(false).required()