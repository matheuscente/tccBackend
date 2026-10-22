import { Joi } from "celebrate"
import { baseStatsFields } from "./base-stats.schema"

export const statsUserQuerySchema = Joi.object().keys({
    userId: baseStatsFields.userId

}).prefs({ abortEarly: false }).unknown(false)
