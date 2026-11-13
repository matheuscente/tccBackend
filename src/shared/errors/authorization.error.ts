import { ErrorBase } from "./base-error";

export class AuthorizationError extends ErrorBase {
    constructor(message: string, status?: number) {
        super(status = 401, message)
    }
}