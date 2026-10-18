import type { ForgotPasswordDTO, ResetPasswordDTO } from "../../DTOs/password-reset.DTO";

export interface IPasswordResetService {
    requestReset(data: ForgotPasswordDTO): Promise<void>
    resetPassword(data: ResetPasswordDTO): Promise<void>
}
