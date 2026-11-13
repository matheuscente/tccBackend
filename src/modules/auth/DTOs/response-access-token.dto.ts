import type { GenerateAccessTokenDTO } from "./generate-access-token.dto"

export interface ResponseAccessTokenDTO extends GenerateAccessTokenDTO{
    iat: number,
    exp: number
}

