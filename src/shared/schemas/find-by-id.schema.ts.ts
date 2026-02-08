import { Joi } from "celebrate";

export const FindUserByIdQuerySchema = Joi.object({
  id: Joi.string()
    .uuid({ version: "uuidv4" })
    .required(),
})
  .prefs({ abortEarly: false })
  .unknown(false);