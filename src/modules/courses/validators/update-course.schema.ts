import { Joi } from "celebrate";
import { baseCourseFields } from "./base-course.schema";

export const updateCourseSchema = Joi.object().keys({
    title: baseCourseFields.title,

    description: baseCourseFields.description

}).prefs({abortEarly: false}).unknown(false).required()