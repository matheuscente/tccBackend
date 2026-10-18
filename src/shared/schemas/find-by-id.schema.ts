import { Joi } from "celebrate";
import { ErrorMessages } from "../errorMessages/ErrorMessages";

export const FindByIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: "uuidv4" })
    .required()
    .messages({
      "string.required": ErrorMessages.required("id")
    })
})
  .prefs({ abortEarly: false })
  .unknown(false);