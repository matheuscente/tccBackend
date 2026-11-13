import type { ResponseQuestionDTO } from "../../questions/DTOs/response-question.DTO"

export interface ResponseActivityForAnsweringDTO {
    id: string
    title: string
    description: string | null
    questions: ResponseQuestionDTO[]
}
