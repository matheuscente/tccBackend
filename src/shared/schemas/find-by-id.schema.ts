import { Joi } from "celebrate";
import { ErrorMessages } from "../errorMessages/errorMessages";

export const FindByIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: "uuidv4" })
    .required()
    .messages({
      "any.required": ErrorMessages.required("id")
    })
})
  .prefs({ abortEarly: false })
  .unknown(false);