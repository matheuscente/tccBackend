import { Joi } from "celebrate"

export const baseDisciplineFields = {
    title: Joi.string()
        .min(3)
        .max(100),

    description: Joi.string()
        .min(3)
        .max(500)
        .allow(null, ""),

    userId: Joi.string()
        .uuid({ version: "uuidv4" }),

    moduleId: Joi.string()
        .uuid({ version: "uuidv4" })
}