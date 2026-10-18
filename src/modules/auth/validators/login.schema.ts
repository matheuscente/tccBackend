import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const loginAuthSchema = Joi.object().keys({
      username: Joi.string()
  .min(4)
  .required()
  .messages({
    'string.required': ErrorMessages.required("username"),
    'string.min': ErrorMessages.min("username"),
    'string.empty': ErrorMessages.empty("username"),
    "string.base": ErrorMessages.type("username", "um texto"),


}),

  password: Joi.string()
    .min(8)
    .required()
    .messages({
    'any.required': ErrorMessages.required("senha"),
    'string.min': ErrorMessages.min("senha"),
    'string.empty': ErrorMessages.empty("senha"),
    "string.base": ErrorMessages.type("senha", "um texto"),

})

}).prefs({abortEarly: false})
.unknown(false)
.required()
