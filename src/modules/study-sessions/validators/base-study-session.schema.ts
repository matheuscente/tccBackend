import { Joi } from "celebrate"

export const baseStudySessionFields = {
    minutes: Joi.number()
        .min(1),
        
    studiedAt: Joi.string()
        .pattern(/^\d{2}\/\d{2}\/\d{4}$/),

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

    studySessionId: Joi.string()
        .uuid({ version: "uuidv4" })
}