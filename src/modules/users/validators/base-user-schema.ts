import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages";

export const baseUserFields = {
  name: Joi.string()
    .min(5)
    .max(50)
    .messages({
        'string.required': ErrorMessages.required("nome"),
        'string.min': ErrorMessages.min("nome"),
        'string.empty': ErrorMessages.empty("nome"),
        "string.base": ErrorMessages.type("nome", "um texto")
    }),

  username: Joi.string()
  .min(5)
  .max(20)
  .pattern(/^[a-zA-Z0-9_]+$/, "alphanumeric with underscores")
  .messages({
    "string.min": ErrorMessages.min("nome de usuário"),
    "string.max": ErrorMessages.max("nome de usuário"),
    "string.empty": ErrorMessages.empty("nome de usuário"),
    "string.pattern.name": ErrorMessages.notContain('nome de usuário', "caracteres especiais")
  }
  )
,

  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(/[a-z]/, "letra maiúscula")
    .pattern(/[A-Z]/, "letra minúscula")
    .pattern(/[0-9]/, "número")
    .messages({
    "string.min": ErrorMessages.min("senha"),
    "string.max": ErrorMessages.max("senha"),
    "string.empty": ErrorMessages.empty("senha"),
    'string.pattern.name': 'A senha precisa conter pelo menos um(a) {#name}.'

  }),

   birthDate: Joi.string()
  .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
  .messages({
    "string.pattern.base": ErrorMessages.regex("data de nascimento", "dd/mm/aaaa")
  })
};