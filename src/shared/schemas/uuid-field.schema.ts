import { Joi } from "celebrate";
import { ErrorMessages } from "../errorMessages/errorMessages";

export const uuidField = (field: string) => Joi.string()
    .uuid({ version: "uuidv4" })
    .messages({
        "string.empty": ErrorMessages.empty(field),
        "string.base": ErrorMessages.type(field, "um texto"),
        "string.guid": `O campo ${field} deve ser um id válido.`
    })
