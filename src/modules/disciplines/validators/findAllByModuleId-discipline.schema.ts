import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"

export const findAllByModuleIdSchema = Joi.object().keys({
   moduleId: baseDisciplineFields.moduleId.required()

}).prefs({ abortEarly: false }).unknown(false).required()