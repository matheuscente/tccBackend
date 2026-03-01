import { Joi } from "celebrate"

export const baseCourseFields = {
    title: Joi.string()
        .min(5)
        .max(100),

    description: Joi.string()
        .min(5)
        .max(500),

    userId: Joi.string()
    .uuid({ version: "uuidv4" })
}