import { Joi } from "celebrate"
import { baseModuleFields } from "./base-module.schema"

export const findAllByUserIdSchema = Joi.object().keys({
    userId: baseModuleFields.userId.required()

}).prefs({ abortEarly: false }).unknown(false).required()