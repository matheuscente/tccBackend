export interface ForgotPasswordDTO {
    email: string
}

export interface ResetPasswordDTO {
    token: string
    newPassword: string
}

export interface CreatePasswordResetTokenDTO {
    userId: string
    tokenHash: string
    expiresAt: Date
}
