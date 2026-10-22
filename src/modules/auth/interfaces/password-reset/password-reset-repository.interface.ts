import type { PasswordResetToken } from "@prisma/client";
import type { CreatePasswordResetTokenDTO } from "../../DTOs/create-password-reset-token.DTO";

export interface IPasswordResetRepository {
    create(data: CreatePasswordResetTokenDTO): Promise<PasswordResetToken>
    findById(id: string): Promise<PasswordResetToken | null>
    markAsUsed(id: string): Promise<boolean>
    invalidateAllByUserId(userId: string): Promise<void>
}
