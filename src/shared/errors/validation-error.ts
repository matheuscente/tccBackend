import { ErrorBase } from "./base-error";
import type { HttpItemResponseError } from "./interfaces/http-item-response-error.dto";

export class ValidationError extends ErrorBase {
    constructor(message: string | Array<HttpItemResponseError>) {
        super(400, message)
    }
}