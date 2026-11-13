import { celebrate, Joi, Segments } from "celebrate";
import { joiDefaultMessages } from "../shared/errorMessages/joiDefaultMessages";

// mensagens em português e sem aspas no nome do campo ("O campo id..." em vez de "\"id\"...")
const joiOptions: Joi.ValidationOptions = {
    messages: joiDefaultMessages,
    errors: { wrap: { label: false, array: false } }
}

export abstract class RequestValidator {

    static bodyValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.BODY]: schema
        }, joiOptions)
    }

    static queryValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.QUERY]: schema
        }, joiOptions)
    }

    static paramsValidator(schema: Joi.ObjectSchema) {
        return celebrate({
            [Segments.PARAMS]: schema
        }, joiOptions)
    }
}
