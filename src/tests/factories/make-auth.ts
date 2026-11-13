import type { AuthResponseDTO } from "../../modules/auth/DTOs/auth-response.dto"
import type { LoginDTO } from "../../modules/auth/DTOs/login.dto"

const makeAuth = (overrides?: Partial<LoginDTO>): AuthResponseDTO => {
        return {
    accessToken: "access-token-test",
    refreshToken: {
        token: "refresh-token-test",
        expiresAt: 2000000
    }
}
    }