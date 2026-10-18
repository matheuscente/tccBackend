import { Joi } from "celebrate";
import { ErrorMessages } from "../errorMessages/errorMessages";

const uuid = (field: string) => Joi.string()
    .uuid({ version: "uuidv4" })
    .messages({
        "string.empty": ErrorMessages.empty(field),
        "string.base": ErrorMessages.type(field, "um texto"),
        "string.guid": `O campo ${field} deve ser um id válido.`
    })

/**
 * Campos reutilizados por questões, atividades, notas e arquivos.
 */
export const scopeFields = {
    userId: uuid("userId"),
    courseId: uuid("courseId").allow(null),
    moduleId: uuid("moduleId").allow(null),
    disciplineId: uuid("disciplineId").allow(null)
}

export const scopeQuerySchema = Joi.object({
    courseId: uuid("courseId"),
    moduleId: uuid("moduleId"),
    disciplineId: uuid("disciplineId"),
    search: Joi.string().trim().max(100).allow("")
}).oxor("courseId", "moduleId", "disciplineId")
    .prefs({ abortEarly: false })
    .unknown(false)
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })

export const userIdParamSchema = Joi.object({
    userId: uuid("userId").required().messages({ "any.required": ErrorMessages.required("userId") })
}).prefs({ abortEarly: false }).unknown(false)

export const uuidParam = uuid
