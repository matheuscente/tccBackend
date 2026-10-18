import { Joi } from "celebrate";
import { baseUserFields } from "./base-user-schema";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const CreateUserSchema = Joi.object().keys({
    name: baseUserFields.name
    .required()
    .messages({
        "any.required": ErrorMessages.required("nome")
    }),

    username: baseUserFields.username
    .required()
    .messages({
        "any.required": ErrorMessages.required("nome de usuário")
    }),

    email: baseUserFields.email
    .required()
    .messages({
        "any.required": ErrorMessages.required("e-mail")
    }),

    password: baseUserFields.password
    .required()
     .messages({
        "any.required": ErrorMessages.required("senha")
    }),

    birthDate: baseUserFields.birthDate.required()
}).prefs({abortEarly: false}).unknown(false).required()