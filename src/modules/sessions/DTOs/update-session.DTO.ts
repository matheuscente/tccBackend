export interface UpdateSessionDTO {
    refreshToken: string,
    expiresAt: Date,
    previousRefreshToken?: string | null,
    rotatedAt?: Date | null
}
