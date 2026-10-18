import { Joi } from "celebrate";
import { scopeFields } from "../../../shared/schemas/scope-fields.schema";

// multipart envia strings; "" significa sem escopo
const optionalScope = {
    courseId: scopeFields.courseId.empty(""),
    moduleId: scopeFields.moduleId.empty(""),
    disciplineId: scopeFields.disciplineId.empty("")
}

export const uploadFileSchema = Joi.object(optionalScope)
    .oxor("courseId", "moduleId", "disciplineId")
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false)

export const updateFileSchema = Joi.object({
    originalName: Joi.string().trim().min(1).max(200),
    courseId: scopeFields.courseId,
    moduleId: scopeFields.moduleId,
    disciplineId: scopeFields.disciplineId
}).min(1).prefs({ abortEarly: false }).unknown(false).required()

export const fileContentQuerySchema = Joi.object({
    token: Joi.string().max(2000).required(),
    download: Joi.string().valid("1")
}).prefs({ abortEarly: false }).unknown(false)
