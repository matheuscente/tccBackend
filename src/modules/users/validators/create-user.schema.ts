import { Joi } from "celebrate";
import { baseUserFields } from "./base-user-schema";

export const CreateUserSchema = Joi.object().keys({
    name: baseUserFields.name.required(),

    username: baseUserFields.username.required(),

    password: baseUserFields.password.required(),

    birthDate: baseUserFields.birthDate.required()
}).prefs({abortEarly: false}).unknown(false).required()