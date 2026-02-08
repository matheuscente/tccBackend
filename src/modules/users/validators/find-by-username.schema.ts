import { Joi } from "celebrate";


export const FindUserByUsernameQuerySchema = Joi.object({
  username: Joi.string()
    .min(5)
    .max(20)
    .required(),
})
  .prefs({ abortEarly: false })
  .unknown(false);