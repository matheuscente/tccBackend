import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const ListUsersSchema = Joi.object({
    search: Joi.string().trim().max(100).allow("")
        .messages({
            "string.base": ErrorMessages.type("busca", "um texto"),
            "string.max": ErrorMessages.max("busca")
        }),

    page: Joi.number().integer().min(1)
        .messages({
            "number.base": ErrorMessages.type("página", "um número"),
            "number.integer": ErrorMessages.type("página", "um número inteiro"),
            "number.min": ErrorMessages.minNumber("página", "{#limit}")
        }),

    pageSize: Joi.number().integer().min(1).max(100)
        .messages({
            "number.base": ErrorMessages.type("itens por página", "um número"),
            "number.integer": ErrorMessages.type("itens por página", "um número inteiro"),
            "number.min": ErrorMessages.minNumber("itens por página", "{#limit}"),
            "number.max": ErrorMessages.maxNumber("itens por página", "{#limit}")
        })
}).prefs({ abortEarly: false }).unknown(false)
