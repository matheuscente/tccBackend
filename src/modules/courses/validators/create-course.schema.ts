import { Joi } from "celebrate";
import { baseCourseFields } from "./base-course.schema";

export const createCourseSchema = Joi.object().keys({
    title: baseCourseFields.title.required(),

    description: baseCourseFields.description,

    userId: baseCourseFields.userId
}).prefs({abortEarly: false}).unknown(false).required()