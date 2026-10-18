import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";
import { scopeFields } from "../../../shared/schemas/scope-fields.schema";

const title = Joi.string().trim().min(1).max(150).messages({
    "string.max": ErrorMessages.max("título"),
    "string.empty": ErrorMessages.empty("título")
})

const content = Joi.string().max(100000).allow("").messages({
    "string.max": "A nota pode ter no máximo 100.000 caracteres."
})

const scopeMessage = { "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." }

export const createNoteSchema = Joi.object({
    title: title.required().messages({ "any.required": ErrorMessages.required("título") }),
    content,
    courseId: scopeFields.courseId,
    moduleId: scopeFields.moduleId,
    disciplineId: scopeFields.disciplineId
}).oxor("courseId", "moduleId", "disciplineId").messages(scopeMessage)
    .prefs({ abortEarly: false }).unknown(false).required()

export const updateNoteSchema = Joi.object({
    title,
    content,
    courseId: scopeFields.courseId,
    moduleId: scopeFields.moduleId,
    disciplineId: scopeFields.disciplineId
}).min(1).prefs({ abortEarly: false }).unknown(false).required()
