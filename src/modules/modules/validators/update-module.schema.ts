import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"

export const updateModuleSchema = Joi.object().keys({
    title: baseModuleFields.title,

    description: baseModuleFields.description

}).prefs({ abortEarly: false }).unknown(false).required()