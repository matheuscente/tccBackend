import { celebrate, Joi, Segments } from "celebrate";


// Centraliza validações HTTP usando Celebrate/Joi

export abstract class RequestValidator {

    static bodyValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.BODY]: schema
        })
    }

    static queryValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.QUERY]: schema
        })
    }

        static paramsValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.PARAMS]: schema
        })
    }
}