import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"

export const updateStudySessionSchema = Joi.object().keys({
    minutes: baseStudySessionFields.minutes,

    studiedAt: baseStudySessionFields.studiedAt

}).prefs({ abortEarly: false }).unknown(false).required()