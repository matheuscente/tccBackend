import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"

export const findAllByUserIdStudySessionSchema = Joi.object().keys({
    userId: baseStudySessionFields.userId.required()

}).prefs({ abortEarly: false }).unknown(false).required()