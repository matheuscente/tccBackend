import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO";
import type { CreateGoalDTO } from "../../DTOs/create-goal.DTO";
import type { ResponseGoalDTO } from "../../DTOs/response-goal.DTO";
import type { UpdateGoalDTO } from "../../DTOs/update-goal.DTO";

export interface IGoalService {
    create(authUser: AuthUserDTO, data: CreateGoalDTO): Promise<ResponseGoalDTO>;
    findById(authUser: AuthUserDTO, goalId: string): Promise<ResponseGoalDTO | null>;
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseGoalDTO[]>;
    update(authUser: AuthUserDTO, goalId: string, data: UpdateGoalDTO): Promise<ResponseGoalDTO>;
    delete(authUser: AuthUserDTO, goalId: string): Promise<void>;
}