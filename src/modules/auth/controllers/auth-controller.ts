import type { NextFunction, Request, Response } from "express";
import type { IAuthController } from "../interfaces/auth/auth-controller.interface";
import type { IAuthService } from "../interfaces/auth/auth-service.interface";
import type { LoginDTO } from "../DTOs/login.dto";

export class AuthController implements IAuthController {
    constructor(
        private readonly service: IAuthService
    ) { }

    async login(req: Request<any, any, LoginDTO>, res: Response, next: NextFunction): Promise<void> {
        try {
            const { username, password } = req.body;

            const result = await this.service.login({
                username,
                password
            })

            this.setRefreshCookie(res, result.refreshToken.token, result.refreshToken.expiresAt)


            res.status(200).json({
                data: {
                    accessToken: result.accessToken,
                    sessionExpiresAt: result.refreshToken.expiresAt
                }
            })

        } catch (err) {

            next(err)

        }

    }

    async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

            const authHeader = req.headers.authorization

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                res.status(401).json({ message: "Token não informado" })
                return
            }

            const token = authHeader.split(" ")[1]

            if(!token) {
                res.status(401).json({ message: "Token não informado" })
                return
            }

            await this.service.logout(token)

            res.clearCookie("rToken", {
                path: "/auth/refresh"
            })

            res.status(204).send()

        } catch (err) {

            next(err)

        }
    }
    async refreshSession(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

            const refreshToken: unknown = req.cookies.rToken

            if (!refreshToken || typeof refreshToken !== "string") {
                res.status(401).json({ message: "Refresh token inválido ou não informado" });
                return
            }

            const result = await this.service.refreshSession(refreshToken);

            res.clearCookie("rToken", {
                path: "/auth/refresh"
            })

            this.setRefreshCookie(res, result.refreshToken.token, result.refreshToken.expiresAt)


            res.status(200).json({
                data: {
                    accessToken: result.accessToken,
                    sessionExpiresAt: result.refreshToken.expiresAt
                }
            })

        } catch (err) {

            next(err)

        }
    }

    private setRefreshCookie(res: Response, token: string, expiresAt: number): void {
    res.cookie("rToken", token, {
        httpOnly: true,
        secure: false, //mudar em produção
        sameSite: "none",
        path: "/auth/refresh",
        expires: new Date(expiresAt * 1000)

    })
}

}