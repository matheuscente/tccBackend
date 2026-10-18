import type { IMailProvider, SendMailDTO } from "./mail-provider.interface";

/**
 * Provedor usado em desenvolvimento, quando o SMTP não está configurado.
 * Mostra o e-mail no console do backend.
 */
export class ConsoleMailProvider implements IMailProvider {
    async send(mail: SendMailDTO): Promise<void> {
        console.log("\n================ E-MAIL (modo desenvolvimento) ================")
        console.log(`Para: ${mail.to}`)
        console.log(`Assunto: ${mail.subject}`)
        console.log(mail.text)
        console.log("================================================================\n")
    }
}
