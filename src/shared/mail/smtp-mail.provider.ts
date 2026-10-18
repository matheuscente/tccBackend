import nodemailer, { type Transporter } from "nodemailer";
import type { IMailProvider, SendMailDTO } from "./mail-provider.interface";

interface SmtpConfig {
    host: string
    port: number
    secure: boolean
    user?: string | undefined
    pass?: string | undefined
    from: string
}

export class SmtpMailProvider implements IMailProvider {
    private readonly transporter: Transporter

    constructor(private readonly config: SmtpConfig) {
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
