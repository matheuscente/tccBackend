import { randomUUID } from "crypto";
import type { IHashProvider } from "../../../../shared/hash/interfaces/hash-provider.interface";
import type { IMailProvider } from "../../../../shared/mail/mail-provider.interface";
import { ValidationError } from "../../../../shared/errors/validation-error";
import type { IUserRepository } from "../../../users/interfaces/user-repository.interface";
import type { ISessionService } from "../../../sessions/interfaces/services/session-service.interface";
import type { ForgotPasswordDTO, ResetPasswordDTO } from "../../DTOs/password-reset.DTO";
import type { IPasswordResetRepository } from "../../interfaces/password-reset/password-reset-repository.interface";
import type { IPasswordResetService } from "../../interfaces/password-reset/password-reset-service.interface";

const TOKEN_DURATION_MS = 1000 * 60 * 30 // 30 minutos

const escapeHtml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export class PasswordResetService implements IPasswordResetService {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordResetRepository: IPasswordResetRepository,
        private readonly sessionService: ISessionService,
        private readonly hash: IHashProvider,
        private readonly mailProvider: IMailProvider,
        private readonly frontendUrl: string
    ) { }

    async requestReset(data: ForgotPasswordDTO): Promise<void> {
        const user = await this.userRepository.findByEmail(data.email.trim().toLowerCase())

        // não revela se o e-mail existe: a resposta é sempre a mesma
        if (!user) return

        await this.passwordResetRepository.invalidateAllByUserId(user.id)

        // mesmo formato do refresh token: <id>.<segredo>, guardando apenas o hash do segredo
        const secret = randomUUID()
        const tokenHash = await this.hash.hash(secret)

        const record = await this.passwordResetRepository.create({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + TOKEN_DURATION_MS)
        })

        const link = `${this.frontendUrl}/reset-password?token=${encodeURIComponent(`${record.id}.${secret}`)}`

        await this.mailProvider.send({
            to: user.email,
            subject: "Redefinição de senha - Organizador de Estudos",
            text: `Olá, ${user.name}.\n\nRecebemos um pedido para redefinir sua senha. Acesse o link abaixo (válido por 30 minutos):\n${link}\n\nSe você não fez este pedido, ignore este e-mail.`,
            html: `<p>Olá, ${escapeHtml(user.name)}.</p><p>Recebemos um pedido para redefinir sua senha. O link é válido por 30 minutos:</p><p><a href="${link}">Redefinir minha senha</a></p><p>Se você não fez este pedido, ignore este e-mail.</p>`
        })
    }

    async resetPassword(data: ResetPasswordDTO): Promise<void> {
        const [tokenId, secret] = data.token.split(".")

        if (!tokenId || !secret) throw new ValidationError("Link de redefinição inválido")

        const record = await this.passwordResetRepository.findById(tokenId)

        if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
            throw new ValidationError("Link de redefinição inválido ou expirado")
        }

        const isMatch = await this.hash.compare(secret, record.tokenHash)
        if (!isMatch) throw new ValidationError("Link de redefinição inválido ou expirado")

        const user = await this.userRepository.findById(record.userId)
        if (!user) throw new ValidationError("Link de redefinição inválido ou expirado")

        // marca o token como usado antes de trocar a senha: evita uso duplo em requisições simultâneas
        const claimed = await this.passwordResetRepository.markAsUsed(record.id)
        if (!claimed) throw new ValidationError("Link de redefinição inválido ou expirado")

        const hashedPassword = await this.hash.hash(data.newPassword)

        await this.userRepository.updatePassword(user.id, hashedPassword)

        // encerra as sessões abertas por segurança
        await this.sessionService.invalidateAllByUserId(user.id)
    }
}
