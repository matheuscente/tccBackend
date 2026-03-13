import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"

export const createModuleSchema = Joi.object().keys({
    title: baseModuleFields.title.required(),

    description: baseModuleFields.description,

    courseId: baseModuleFields.courseId.required()

}).prefs({ abortEarly: false }).unknown(false).required()