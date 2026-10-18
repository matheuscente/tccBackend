import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { ResponseQuestionDTO } from "../../../questions/DTOs/response-question.DTO"
import type { CreateActivityDTO, ResponseActivityDTO, ResponseActivityDetailDTO, ResponseAttemptDTO, SubmitAttemptDTO, UpdateActivityDTO } from "../../DTOs/activity.DTO"

export interface IActivityService {
    create(authUser: AuthUserDTO, data: CreateActivityDTO): Promise<ResponseActivityDetailDTO>
    findById(authUser: AuthUserDTO, activityId: string): Promise<ResponseActivityDetailDTO | null>
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseActivityDTO[]>
    update(authUser: AuthUserDTO, activityId: string, data: UpdateActivityDTO): Promise<ResponseActivityDetailDTO>
    setQuestions(authUser: AuthUserDTO, activityId: string, questionIds: string[]): Promise<ResponseActivityDetailDTO>
    softDelete(authUser: AuthUserDTO, activityId: string): Promise<void>
    getForAnswering(authUser: AuthUserDTO, activityId: string): Promise<{ id: string, title: string, description: string | null, questions: ResponseQuestionDTO[] }>
    submitAttempt(authUser: AuthUserDTO, activityId: string, data: SubmitAttemptDTO): Promise<ResponseAttemptDTO>
    findAttempts(authUser: AuthUserDTO, activityId: string): Promise<ResponseAttemptDTO[]>
    findAttemptById(authUser: AuthUserDTO, attemptId: string): Promise<ResponseAttemptDTO | null>
}
