import type { CreateQuestionRepositoryDTO, UpdateQuestionRepositoryDTO } from "../../DTOs/create-question-repository.DTO"
import type { QuestionScopeFilterDTO, QuestionWithOptionsDTO } from "../../DTOs/question-with-options.DTO"

export interface IQuestionRepository {
    create(data: CreateQuestionRepositoryDTO): Promise<QuestionWithOptionsDTO>
    findById(questionId: string): Promise<QuestionWithOptionsDTO | null>
    findAllByUserId(userId: string, filter?: QuestionScopeFilterDTO): Promise<QuestionWithOptionsDTO[]>
    findManyByIds(questionIds: string[], userId: string): Promise<QuestionWithOptionsDTO[]>
    update(questionId: string, data: UpdateQuestionRepositoryDTO): Promise<QuestionWithOptionsDTO>
    softDelete(questionId: string): Promise<void>
}
