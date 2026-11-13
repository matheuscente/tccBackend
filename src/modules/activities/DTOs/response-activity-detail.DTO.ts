import type { ResponseQuestionDTO } from "../../questions/DTOs/response-question.DTO"
import type { ResponseActivityDTO } from "./response-activity.DTO"

export interface ResponseActivityDetailDTO extends ResponseActivityDTO {
    questions: ResponseQuestionDTO[]
}
