import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"

export const updateDisciplineSchema = Joi.object().keys({
    title: baseDisciplineFields.title,

    description: baseDisciplineFields.description

}).prefs({ abortEarly: false }).unknown(false).required()