import type { NextFunction, Request, Response } from "express";
import type { IAuthController } from "../interfaces/auth/auth-controller.interface";
import type { IAuthService } from "../interfaces/auth/auth-service.interface";
import type { IPasswordResetService } from "../interfaces/password-reset/password-reset-service.interface";
import type { LoginDTO } from "../DTOs/login.dto";
import type { ForgotPasswordDTO } from "../DTOs/forgot-password.DTO";
import type { ResetPasswordDTO } from "../DTOs/reset-password.DTO";
import { httpSuccessResponse } from "../../../shared/controller/httpSuccessResponse.util";
import { AuthorizationError } from "../../../shared/errors/authorization.error";

export class AuthController implements IAuthController {
    constructor(
        private readonly service: IAuthService,
        private readonly passwordResetService: IPasswordResetService,
        private readonly cookieSecure: boolean = false
    ) { }

    login = async (req: Request<any, any, LoginDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { username, password } = req.body

            const result = await this.service.login({
                username,
                password
            })

            this.setRefreshCookie(res, result.refreshToken.token, result.refreshToken.expiresAt)

            const response = {
                accessToken: result.accessToken,
                sessionExpiresAt: result.refreshToken.expiresAt
            }

            res.status(200).json(httpSuccessResponse(200, response))

        } catch (err) {
            next(err)
        }
    }

    logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const authHeader = req.headers.authorization

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                throw new AuthorizationError("Token não informado")
            }

            const token = authHeader.split(" ")[1]

            if (!token) throw new AuthorizationError("Token não informado")

            await this.service.logout(token)

            res.clearCookie("rToken", { path: "/" })

            res.status(204).send()

        } catch (err) {
            next(err)
        }
    }

    refreshSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const refreshToken: unknown = req.cookies.rToken

            if (!refreshToken || typeof refreshToken !== "string") {
                throw new AuthorizationError("Refresh token inválido ou não informado")
            }

            const result = await this.service.refreshSession(refreshToken)

            this.setRefreshCookie(res, result.refreshToken.token, result.refreshToken.expiresAt)

            const data = {
                accessToken: result.accessToken,
                sessionExpiresAt: result.refreshToken.expiresAt
            }

            res.status(200).json(httpSuccessResponse(200, data))

        } catch (err) {
            // refresh inválido: remove o cookie para o cliente não insistir
            res.clearCookie("rToken", { path: "/" })
            next(err)
        }
    }

    forgotPassword = async (req: Request<any, any, ForgotPasswordDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = req.body

            await this.passwordResetService.requestReset(data)

            res.status(200).json(httpSuccessResponse(200, {
                message: "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha."
            }))

        } catch (err) {
            next(err)
        }
    }

    resetPassword = async (req: Request<any, any, ResetPasswordDTO>, res: Response, next: NextFunction): Promise<void> => {
        try {
            const data = req.body

            await this.passwordResetService.resetPassword(data)

            res.status(200).json(httpSuccessResponse(200, { message: "Senha redefinida com sucesso." }))

        } catch (err) {
            next(err)
        }
    }

    private setRefreshCookie = (res: Response, token: string, expiresAt: number): void => {
        res.cookie("rToken", token, {
            httpOnly: true,
            secure: this.cookieSecure,
            sameSite: "lax",
            path: "/",
            expires: new Date(expiresAt * 1000)
        })
    }
}
