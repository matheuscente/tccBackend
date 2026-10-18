import type { PasswordResetToken } from "@prisma/client";
import type { CreatePasswordResetTokenDTO } from "../../DTOs/password-reset.DTO";

export interface IPasswordResetRepository {
    create(data: CreatePasswordResetTokenDTO): Promise<PasswordResetToken>
    findById(id: string): Promise<PasswordResetToken | null>
    markAsUsed(id: string): Promise<boolean>
    invalidateAllByUserId(userId: string): Promise<void>
}
