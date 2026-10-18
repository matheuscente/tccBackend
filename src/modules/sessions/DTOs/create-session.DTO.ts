export interface CreateSessionDTO {
    userId: string,
    refreshToken: string,
    expiresAt: Date
}
export interface UpdateSessionDTO {
    refreshToken: string,
    expiresAt: Date,
    previousRefreshToken?: string | null,
    rotatedAt?: Date | null
}
