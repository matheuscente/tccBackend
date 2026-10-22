import { Joi } from "celebrate"
import { baseFileFields } from "./base-file.schema"

// multipart envia strings: "" significa sem escopo
export const uploadFileSchema = Joi.object().keys({
    courseId: baseFileFields.courseId.allow(null).empty(""),

    moduleId: baseFileFields.moduleId.allow(null).empty(""),

    disciplineId: baseFileFields.disciplineId.allow(null).empty("")

}).oxor("courseId", "moduleId", "disciplineId")
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false)
