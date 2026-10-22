import { AuthorizationError } from "./authorization.error";

// 403: estende AuthorizationError para ser tratado pelo errorHandler, trocando apenas o status
export class ForbiddenError extends AuthorizationError {
    constructor(message = "Ação não autorizada") {
        super(message)
        this.status = 403
    }
}
