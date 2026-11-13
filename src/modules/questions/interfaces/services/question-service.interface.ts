import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { CreateQuestionDTO } from "../../DTOs/create-question.DTO"
import type { UpdateQuestionDTO } from "../../DTOs/update-question.DTO"
import type { QuestionScopeFilterDTO } from "../../DTOs/question-scope-filter.DTO"
import type { ResponseQuestionDTO } from "../../DTOs/response-question.DTO"

export interface IQuestionService {
    create(authUser: AuthUserDTO, data: CreateQuestionDTO): Promise<ResponseQuestionDTO>
    findById(authUser: AuthUserDTO, questionId: string): Promise<ResponseQuestionDTO | null>
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: QuestionScopeFilterDTO): Promise<ResponseQuestionDTO[]>
    update(authUser: AuthUserDTO, questionId: string, data: UpdateQuestionDTO): Promise<ResponseQuestionDTO>
    softDelete(authUser: AuthUserDTO, questionId: string): Promise<void>
}
