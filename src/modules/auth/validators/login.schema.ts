import { Joi } from "celebrate";

export const loginAuthSchema = Joi.object().keys({
      username: Joi.string()
  .min(1)
  .required(),

  password: Joi.string()
    .min(1)
    .required()

}).prefs({abortEarly: false})
.unknown(false)
.required()