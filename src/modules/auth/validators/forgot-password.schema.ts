import { Joi } from "celebrate"
import { basePasswordResetFields } from "./base-password-reset.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const forgotPasswordSchema = Joi.object().keys({
    email: basePasswordResetFields.email
        .required()
        .messages({
            "any.required": ErrorMessages.required("e-mail")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
