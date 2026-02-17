import type { AuthResponseDTO } from "../DTOs/auth-response.dto";
import type { LoginDTO } from "../DTOs/login.dto";

export interface IAuthService {
    login(data: LoginDTO): Promise<AuthResponseDTO>

    logout(refreshToken: string): Promise<void>

    refreshSession(refreshToken: string): Promise<AuthResponseDTO>

}