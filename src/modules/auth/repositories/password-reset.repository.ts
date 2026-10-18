import type { PasswordResetToken, Prisma, PrismaClient } from "@prisma/client";
import type { CreatePasswordResetTokenDTO } from "../DTOs/password-reset.DTO";
import type { IPasswordResetRepository } from "../interfaces/password-reset/password-reset-repository.interface";

export class PasswordResetRepository implements IPasswordResetRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreatePasswordResetTokenDTO): Promise<PasswordResetToken> {
        return this.orm.passwordResetToken.create({ data })
    }

    findById(id: string): Promise<PasswordResetToken | null> {
        return this.orm.passwordResetToken.findUnique({ where: { id } })
    }

    async markAsUsed(id: string): Promise<boolean> {
        const result = await this.orm.passwordResetToken.updateMany({
            where: { id, usedAt: null },
            data: { usedAt: new Date() }
        })
        return result.count === 1
    }

    async invalidateAllByUserId(userId: string): Promise<void> {
        await this.orm.passwordResetToken.updateMany({
            where: { userId, usedAt: null },
            data: { usedAt: new Date() }
        })
    }
}
