import { Joi } from "celebrate"
import { baseFileFields } from "./base-file.schema"

export const contentFileSchema = Joi.object().keys({
    token: baseFileFields.token.required(),

    download: baseFileFields.download

}).prefs({ abortEarly: false }).unknown(false)
