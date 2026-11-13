import { Joi } from "celebrate"
import { baseGoalFields } from "./base-goal.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const findAllByUserIdGoalSchema = Joi.object().keys({
    userId: baseGoalFields.userId
    .required()
    .messages({
            "any.required": ErrorMessages.required("userId")
        })

}).prefs({ abortEarly: false }).unknown(false).required()