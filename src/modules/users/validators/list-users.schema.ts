import { Joi } from "celebrate";

export const ListUsersSchema = Joi.object({
    search: Joi.string().trim().max(100).allow(""),
    page: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1).max(100)
}).prefs({ abortEarly: false }).unknown(false)
