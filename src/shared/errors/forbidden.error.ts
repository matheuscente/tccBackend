import { AuthorizationError } from "./authorization.error";

/**
 * Usuário autenticado, mas sem permissão para o recurso (HTTP 403).
 * Estende AuthorizationError para manter compatibilidade com o errorHandler e os testes.
 */
export class ForbiddenError extends AuthorizationError {
    constructor(message = "Ação não autorizada") {
        super(message)
        this.status = 403
    }
}
