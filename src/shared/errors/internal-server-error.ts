import { ErrorBase } from "./base-error.js";

export class InternalServerError extends ErrorBase {
    constructor(message = 'internal server error') {
        super(500, message)
    }
}