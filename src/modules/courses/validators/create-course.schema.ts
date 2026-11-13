import { Joi } from "celebrate";
import { baseCourseFields } from "./base-course.schema";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const createCourseSchema = Joi.object().keys({
    title: baseCourseFields.title
        .required()
        .messages({
            "any.required": ErrorMessages.required("título"),
        }),

    description: baseCourseFields.description,

    userId: baseCourseFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId"),
        })
}).prefs({abortEarly: false}).unknown(false).required()