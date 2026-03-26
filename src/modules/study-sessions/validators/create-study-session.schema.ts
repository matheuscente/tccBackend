import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"

export const createStudySessionSchema = Joi.object().keys({

    minutes: baseStudySessionFields.minutes.required().max(99999999),

    userId: baseStudySessionFields.userId,

    courseId: baseStudySessionFields.courseId,

    moduleId: baseStudySessionFields.moduleId,

    disciplineId: baseStudySessionFields.disciplineId,

    studiedAt: baseStudySessionFields.studiedAt

}).prefs({ abortEarly: false }).unknown(false).required()