import nodemailer, { type Transporter } from "nodemailer";
import type { SendMailDTO } from "../DTOs/send-mail.DTO";
import type { SmtpConfigDTO } from "../DTOs/smtp-config.DTO";
import type { IMailProvider } from "../interfaces/mail-provider.interface";

export class SmtpMailProvider implements IMailProvider {
    private readonly transporter: Transporter

    constructor(private readonly config: SmtpConfigDTO) {
        this.transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            ...(config.user ? { auth: { user: config.user, pass: config.pass ?? "" } } : {})
        })
    }

    async send(mail: SendMailDTO): Promise<void> {
        await this.transporter.sendMail({
            from: this.config.from,
            to: mail.to,
            subject: mail.subject,
            html: mail.html,
            text: mail.text
        })
    }
}
