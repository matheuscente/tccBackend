export interface CreateSessionDTO {
    userId: string,
    refreshToken: string,
    expiresAt: Date
}