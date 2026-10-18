import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const UpdateRoleSchema = Joi.object({
    role: Joi.string().valid("ADMIN", "USER").required().messages({
        "any.only": ErrorMessages.predefinedValues("perfil"),
        "any.required": ErrorMessages.required("perfil")
    })
}).prefs({ abortEarly: false }).unknown(false).required()
