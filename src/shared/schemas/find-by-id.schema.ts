import { Joi } from "celebrate";
import { ErrorMessages } from "../errorMessages/errorMessages";

export const FindByIdSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: "uuidv4" })
    .required()
    .messages({
      "any.required": ErrorMessages.required("id"),
      "string.empty": ErrorMessages.empty("id"),
      "string.base": ErrorMessages.type("id", "um texto"),
      "string.guid": "O campo id deve ser um id válido."
    })
})
  .prefs({ abortEarly: false })
  .unknown(false);