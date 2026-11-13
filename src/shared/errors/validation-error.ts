import { ErrorBase } from "./base-error";
import type { HttpItemResponseError } from "./DTOs/http-item-response-error.dto";

export class ValidationError extends ErrorBase {
    constructor(message: string | Array<HttpItemResponseError>) {
        super(400, message)
    }
}