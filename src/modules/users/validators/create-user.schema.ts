import { Joi } from "celebrate";
import { baseUserFields } from "./base-user-schema";
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages";

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

    password: baseUserFields.password
    .required()
     .messages({
        "any.required": ErrorMessages.required("senha")
    }),

    birthDate: baseUserFields.birthDate.required()
}).prefs({abortEarly: false}).unknown(false).required()