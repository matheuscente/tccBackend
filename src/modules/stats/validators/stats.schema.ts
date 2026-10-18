import { Joi } from "celebrate";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";
import { uuidParam } from "../../../shared/schemas/scope-fields.schema";

const date = (field: string) => Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).messages({
    "string.pattern.base": ErrorMessages.regex(field, "dd/mm/aaaa")
})

export const statsQuerySchema = Joi.object({
    userId: uuidParam("userId"),
    startDate: date("data inicial"),
    endDate: date("data final"),
    courseId: uuidParam("courseId"),
    moduleId: uuidParam("moduleId"),
    disciplineId: uuidParam("disciplineId")
}).oxor("courseId", "moduleId", "disciplineId")
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false)

export const statsUserQuerySchema = Joi.object({
    userId: uuidParam("userId")
}).prefs({ abortEarly: false }).unknown(false)
