import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"

export const findAllByCourseIdSchema = Joi.object().keys({
    courseId: baseModuleFields.courseId.required()

}).prefs({ abortEarly: false }).unknown(false).required()