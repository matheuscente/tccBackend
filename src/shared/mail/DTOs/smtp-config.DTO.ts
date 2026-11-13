export interface SmtpConfigDTO {
    host: string
    port: number
    secure: boolean
    user?: string | undefined
    pass?: string | undefined
    from: string
}
