export interface CreatePasswordResetTokenDTO {
    userId: string
    tokenHash: string
    expiresAt: Date
}
