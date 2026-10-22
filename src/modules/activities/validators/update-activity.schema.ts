import { Joi } from "celebrate"
import { baseActivityFields } from "./base-activity.schema"

export const updateActivitySchema = Joi.object().keys({
    title: baseActivityFields.title,

    description: baseActivityFields.description

}).min(1).prefs({ abortEarly: false }).unknown(false).required()
