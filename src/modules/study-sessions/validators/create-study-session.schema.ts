import { Joi } from "celebrate"
import { baseStudySessionFields } from "./base-study-session.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const createStudySessionSchema = Joi.object().keys({

    minutes: baseStudySessionFields.minutes
    .required()
    .max(99999999)
    .messages({
        "any.required": ErrorMessages.required("minutos"),
        "number.max": ErrorMessages.maxNumber("minutos", "99999999 minutos")
    }),

    userId: baseStudySessionFields.userId,

    courseId: baseStudySessionFields.courseId,

    moduleId: baseStudySessionFields.moduleId,

    disciplineId: baseStudySessionFields.disciplineId,

    studiedAt: baseStudySessionFields.studiedAt
    .required()
    .messages({
        "any.required": ErrorMessages.required("estudado em")
    })

}).xor('courseId', 'moduleId', 'disciplineId').prefs({ abortEarly: false }).unknown(false).required().messages({
    "object.xor": "É permitido o id de somente 1 escopo."
})