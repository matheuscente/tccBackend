import { Joi } from "celebrate"
import { baseGoalFields } from "./base-goal.schema"

export const updateGoalSchema = Joi.object().keys({
    title: baseGoalFields.title,

    targetMinutes: baseGoalFields.targetMinutes,

    endDate: baseGoalFields.endDate,

}).prefs({ abortEarly: false }).unknown(false).required()