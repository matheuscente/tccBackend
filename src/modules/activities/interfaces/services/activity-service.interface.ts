import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO"
import type { CreateActivityDTO } from "../../DTOs/create-activity.DTO"
import type { UpdateActivityDTO } from "../../DTOs/update-activity.DTO"
import type { SubmitAttemptDTO } from "../../DTOs/submit-attempt.DTO"
import type { ResponseActivityDTO } from "../../DTOs/response-activity.DTO"
import type { ResponseActivityDetailDTO } from "../../DTOs/response-activity-detail.DTO"
import type { ResponseActivityForAnsweringDTO } from "../../DTOs/response-activity-for-answering.DTO"
import type { ResponseAttemptDTO } from "../../DTOs/response-attempt.DTO"

export interface IActivityService {
    create(authUser: AuthUserDTO, data: CreateActivityDTO): Promise<ResponseActivityDetailDTO>
    findById(authUser: AuthUserDTO, activityId: string): Promise<ResponseActivityDetailDTO | null>
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseActivityDTO[]>
    update(authUser: AuthUserDTO, activityId: string, data: UpdateActivityDTO): Promise<ResponseActivityDetailDTO>
    setQuestions(authUser: AuthUserDTO, activityId: string, questionIds: string[]): Promise<ResponseActivityDetailDTO>
    softDelete(authUser: AuthUserDTO, activityId: string): Promise<void>
    getForAnswering(authUser: AuthUserDTO, activityId: string): Promise<ResponseActivityForAnsweringDTO>
    submitAttempt(authUser: AuthUserDTO, activityId: string, data: SubmitAttemptDTO): Promise<ResponseAttemptDTO>
    findAttempts(authUser: AuthUserDTO, activityId: string): Promise<ResponseAttemptDTO[]>
    findAttemptById(authUser: AuthUserDTO, attemptId: string): Promise<ResponseAttemptDTO | null>
}
