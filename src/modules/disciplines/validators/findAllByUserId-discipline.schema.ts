import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"

export const findAllByUserIdSchema = Joi.object().keys({
    userId: baseDisciplineFields.userId.required()

}).prefs({ abortEarly: false }).unknown(false).required()