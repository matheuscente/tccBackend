import { Joi } from "celebrate"
import { baseGoalFields } from "./base-goal.schema"

export const createGoalSchema = Joi.object().keys({
    title: baseGoalFields.title.required(),

    type: baseGoalFields.type.required(),

    targetMinutes: baseGoalFields.targetMinutes.required(),

    startDate: baseGoalFields.startDate.required(),

    endDate: baseGoalFields.endDate,

    userId: baseGoalFields.userId,

    courseId: baseGoalFields.courseId,

    moduleId: baseGoalFields.moduleId,

    disciplineId: baseGoalFields.disciplineId

}).xor('courseId', 'moduleId', 'disciplineId') .prefs({ abortEarly: false }).unknown(false).required()