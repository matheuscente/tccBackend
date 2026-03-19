import { Joi } from "celebrate"
import { baseGoalFields } from "./base-goal.schema"

export const findAllByUserIdGoalSchema = Joi.object().keys({
    userId: baseGoalFields.userId.required()

}).prefs({ abortEarly: false }).unknown(false).required()