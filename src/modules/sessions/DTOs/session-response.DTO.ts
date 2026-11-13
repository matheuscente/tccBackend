export interface SessionResponseDTO {
    id: string,
    userId: string,
    refreshToken: string,
    expiresAt: Date
}