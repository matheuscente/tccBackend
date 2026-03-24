import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO";
import type { CreateStudySessionDTO } from "../../DTOs/create-study-session.DTO";
import type { ResponseStudySessionDTO } from "../../DTOs/response-study-session.DTO";
import type { UpdateStudySessionDTO } from "../../DTOs/update-study-session.DTO";

export interface IStudySessionService {
    create(authUser: AuthUserDTO, data: CreateStudySessionDTO): Promise<ResponseStudySessionDTO>;
    findById(authUser: AuthUserDTO, studySessionId: string): Promise<ResponseStudySessionDTO | null>;
    findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseStudySessionDTO[]>;
    update(authUser: AuthUserDTO, studySessionId: string, data: UpdateStudySessionDTO): Promise<ResponseStudySessionDTO>;
    delete(authUser: AuthUserDTO, studySessionId: string): Promise<void>;
}