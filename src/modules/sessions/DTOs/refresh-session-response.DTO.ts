import type { SessionTokenResponseDTO } from "./session-token-response.DTO";

export interface RefreshSessionResponseDTO extends SessionTokenResponseDTO {
    userId: string
}