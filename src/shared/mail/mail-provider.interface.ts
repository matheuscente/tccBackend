export interface SendMailDTO {
    to: string
    subject: string
    html: string
    text: string
}

export interface IMailProvider {
    send(mail: SendMailDTO): Promise<void>
}
