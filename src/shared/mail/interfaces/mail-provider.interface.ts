import type { SendMailDTO } from "../DTOs/send-mail.DTO"

export interface IMailProvider {
    send(mail: SendMailDTO): Promise<void>
}
