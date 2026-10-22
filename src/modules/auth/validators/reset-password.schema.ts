import { Joi } from "celebrate"
import { basePasswordResetFields } from "./base-password-reset.schema"
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages"

export const resetPasswordSchema = Joi.object().keys({
    token: basePasswordResetFields.token
        .required()
        .messages({
            "any.required": ErrorMessages.required("token")
        }),

    newPassword: basePasswordResetFields.newPassword
        .required()
        .messages({
            "any.required": ErrorMessages.required("nova senha")
        })

}).prefs({ abortEarly: false }).unknown(false).required()
