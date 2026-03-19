import { Joi } from "celebrate"

export const baseGoalFields = {
    title: Joi.string()
        .min(3)
        .max(100),

    type: Joi.string()
        .valid("DAILY_ONCE", "DAILY_RECURRING", "TOTAL_BY_DATE", "TOTAL_IN_PERIOD"),

    targetMinutes: Joi.number()
        .integer()
        .min(1),

    startDate: Joi.string()
        .isoDate(),

    endDate: Joi.string()
        .isoDate()
        .allow(null),

    userId: Joi.string()
        .uuid({ version: "uuidv4" }),

    courseId: Joi.string()
        .uuid({ version: "uuidv4" })
        .allow(null),

    moduleId: Joi.string()
        .uuid({ version: "uuidv4" })
        .allow(null),

    disciplineId: Joi.string()
        .uuid({ version: "uuidv4" })
        .allow(null),

    goalId: Joi.string()
        .uuid({ version: "uuidv4" })
}