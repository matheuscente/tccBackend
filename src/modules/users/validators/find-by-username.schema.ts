import { Joi } from "celebrate";


export const FindUserByUsernameSchema = Joi.object({
  username: Joi.string()
    .min(5)
    .max(20)
    .required(),
})
  .prefs({ abortEarly: false })
  .unknown(false);