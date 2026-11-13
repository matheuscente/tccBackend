import type { ForgotPasswordDTO } from "../../DTOs/forgot-password.DTO";
import type { ResetPasswordDTO } from "../../DTOs/reset-password.DTO";

export interface IPasswordResetService {
    requestReset(data: ForgotPasswordDTO): Promise<void>
    resetPassword(data: ResetPasswordDTO): Promise<void>
}
