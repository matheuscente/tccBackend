import { Joi } from "celebrate"

export const baseStudySessionFields = {
    minutes: Joi.number()
        .min(1),
        
    studiedAt: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/),

    userId: Joi.string()
        .uuid({ version: "uuidv4" }),

    courseId: Joi.string()
        .uuid({ version: "uuidv4" }),

    moduleId: Joi.string()
        .uuid({ version: "uuidv4" }),

    disciplineId: Joi.string()
        .uuid({ version: "uuidv4" }),

    studySessionId: Joi.string()
        .uuid({ version: "uuidv4" })
}