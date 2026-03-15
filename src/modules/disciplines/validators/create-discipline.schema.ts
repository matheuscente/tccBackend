import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"

export const createDisciplineSchema = Joi.object().keys({
    title: baseDisciplineFields.title.required(),

    description: baseDisciplineFields.description,

    moduleId: baseDisciplineFields.moduleId.required()

}).prefs({ abortEarly: false }).unknown(false).required()