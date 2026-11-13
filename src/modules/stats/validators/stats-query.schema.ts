import { Joi } from "celebrate"
import { baseStatsFields } from "./base-stats.schema"

export const statsQuerySchema = Joi.object().keys({
    userId: baseStatsFields.userId,

    startDate: baseStatsFields.startDate,

    endDate: baseStatsFields.endDate,

    courseId: baseStatsFields.courseId,

    moduleId: baseStatsFields.moduleId,

    disciplineId: baseStatsFields.disciplineId

}).oxor("courseId", "moduleId", "disciplineId")
    .messages({ "object.oxor": "Informe apenas um escopo: curso, módulo ou disciplina." })
    .prefs({ abortEarly: false }).unknown(false)
