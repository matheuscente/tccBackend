import { Joi } from "celebrate";
import { baseCourseFields } from "./base-course.schema";
import { ErrorMessages } from "../../../shared/errorMessages/errorMessages";

export const findAllByUserIdSchema = Joi.object().keys({

    userId: baseCourseFields.userId
        .required()
        .messages({
            "any.required": ErrorMessages.required("userId"),
        })

}).prefs({abortEarly: false}).unknown(false).required()