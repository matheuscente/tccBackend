import type { HttpResponseSuccess } from "../DTOs/http-response-success.DTO"

export const httpSuccessResponse = (status: number, data: unknown): HttpResponseSuccess => {
    return {
    statusCode: status,
    state: "success",
    data: Array.isArray(data) ? data : [data]
}
} 