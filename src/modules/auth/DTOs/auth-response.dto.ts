export interface AuthResponseDTO {
    accessToken: string,
    refreshToken: {
        token: string,
        expiresAt: number
    },
}