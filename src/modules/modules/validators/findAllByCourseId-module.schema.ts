import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const findAllByCourseIdSchema = Joi.object().keys({
    courseId: baseModuleFields.courseId
    .required()
    .messages({
        "any.required": ErrorMessages.required("courseId")
    })

}).prefs({ abortEarly: false }).unknown(false).required()