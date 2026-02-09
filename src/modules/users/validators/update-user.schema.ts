import { Joi } from "celebrate";
import { baseUserFields } from "./base-user-schema";

export const UpdateUserSchema = Joi.object().keys({
    name: baseUserFields.name,

    username: baseUserFields.username,
        
    birthDate: baseUserFields.birthDate
}).prefs({abortEarly: false})
.unknown(false)
.min(1)
.required()