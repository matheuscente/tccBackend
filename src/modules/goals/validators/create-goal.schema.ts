import { Joi } from "celebrate"
import { baseGoalFields } from "./base-goal.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const createGoalSchema = Joi.object().keys({
    title: baseGoalFields.title
    .required()
    .messages({
        "any.required": ErrorMessages.required("título")
    }),

    type: baseGoalFields.type
    .required()
    .messages({
        "any.required": ErrorMessages.required("tipo")
    }),

    targetMinutes: baseGoalFields.targetMinutes
    .required()
    .messages({
        "any.required": ErrorMessages.required("tempo da meta")
    }),

    startDate: baseGoalFields.startDate.required()
    .messages({
        "any.required": ErrorMessages.required("data de início")
    }),

    endDate: baseGoalFields.endDate,

    userId: baseGoalFields.userId,

    courseId: baseGoalFields.courseId,

    moduleId: baseGoalFields.moduleId,

    disciplineId: baseGoalFields.disciplineId

}).xor('courseId', 'moduleId', 'disciplineId') .prefs({ abortEarly: false }).unknown(false).required()