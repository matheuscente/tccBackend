import { Joi } from "celebrate"
import { baseDisciplineFields } from "./base-discipline.schema"
import { ErrorMessages } from "../../../shared/errorMessages/ErrorMessages"

export const findAllByModuleIdSchema = Joi.object().keys({
   moduleId: baseDisciplineFields.moduleId
   .required()
   .messages({
           "any.required": ErrorMessages.required("moduleId")
       })

}).prefs({ abortEarly: false }).unknown(false).required()