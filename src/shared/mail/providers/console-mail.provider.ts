import type { SendMailDTO } from "../DTOs/send-mail.DTO";
import type { IMailProvider } from "../interfaces/mail-provider.interface";

// usado quando o SMTP não está configurado: o e-mail é exibido no console
export class ConsoleMailProvider implements IMailProvider {
    async send(mail: SendMailDTO): Promise<void> {
        console.log("\n================ E-MAIL (modo desenvolvimento) ================")
        console.log(`Para: ${mail.to}`)
        console.log(`Assunto: ${mail.subject}`)
        console.log(mail.text)
        console.log("================================================================\n")
    }
}
