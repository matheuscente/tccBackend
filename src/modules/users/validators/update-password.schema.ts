import { Joi } from "celebrate";
import { baseUserFields } from "./base-user-schema";

export const UpdateUserPasswordSchema = Joi.object().keys({
    
    oldPassword: Joi.string()
                    .required(),

    newPassword: baseUserFields.password.required().not(Joi.ref("oldPassword")),

}).prefs({abortEarly: false})
.unknown(false)