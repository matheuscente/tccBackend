import { Joi } from "celebrate";
import { baseCourseFields } from "./base-course.schema";

export const findAllByUserIdSchema = Joi.object().keys({

    userId: baseCourseFields.userId.required()

}).prefs({abortEarly: false}).unknown(false).required()