import type { HttpItemResponseError } from "./http-item-response-error.dto"

export interface HttpResponseError {
    statusCode: number,
    state: "error"
    data: HttpItemResponseError[]
}