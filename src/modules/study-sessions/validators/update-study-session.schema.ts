import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const updateStudySessionSchema = Joi.object().keys({
    minutes: baseStudySessionFields.minutes
    .max(1440)
    .messages({
        "number.max": ErrorMessages.maxNumber("minutos", "1440 minutos (24 horas)")
    }),

    studiedAt: baseStudySessionFields.studiedAt

}).prefs({ abortEarly: false }).unknown(false).required()