import { Joi } from "celebrate";
import { baseUserFields } from "../../users/validators/base-user-schema";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const forgotPasswordSchema = Joi.object({
    email: baseUserFields.email.required().messages({
        "any.required": ErrorMessages.required("e-mail")
    })
}).prefs({ abortEarly: false }).unknown(false).required()

export const resetPasswordSchema = Joi.object({
    token: Joi.string().max(300).required().messages({
        "any.required": ErrorMessages.required("token")
    }),
    newPassword: baseUserFields.password.required().messages({
        "any.required": ErrorMessages.required("nova senha")
    })
}).prefs({ abortEarly: false }).unknown(false).required()
