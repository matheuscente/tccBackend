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
         .pattern(/^\d{2}\/\d{2}\/\d{4}$/),

    endDate: Joi.string()
         .pattern(/^\d{2}\/\d{2}\/\d{4}$/)
        .allow(null),

    userId: Joi.string()
        .uuid({ version: "uuidv4" }),

    courseId: Joi.string()
        .uuid({ version: "uuidv4" }),
        
    moduleId: Joi.string()
        .uuid({ version: "uuidv4" }),
        
    disciplineId: Joi.string()
        .uuid({ version: "uuidv4" }),
        
    goalId: Joi.string()
        .uuid({ version: "uuidv4" })
}