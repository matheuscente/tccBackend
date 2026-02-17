import type { GenerateAccessTokenDTO } from "../../DTOs/generate-access-token.dto"
import type { ResponseAccessTokenDTO } from "../../DTOs/response-access-token.dto"

export interface IAccessTokenService {
    generateAccessToken(data: GenerateAccessTokenDTO): string

    extractPayload(accessToken: string): ResponseAccessTokenDTO


}