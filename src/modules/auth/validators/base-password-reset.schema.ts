import { Joi } from "celebrate"
import { baseUserFields } from "../../users/validators/base-user-schema"

export const basePasswordResetFields = {
    email: baseUserFields.email,

    token: Joi.string().max(300),

    newPassword: baseUserFields.password
}
