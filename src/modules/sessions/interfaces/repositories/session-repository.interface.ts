import type { Session } from "@prisma/client";
import type { CreateSessionDTO } from "../../DTOs/create-session.DTO";
import type { SessionWithUserDTO } from "../../DTOs/session-with-user.DTO"

export interface ISessionRepository {
    create(data: CreateSessionDTO): Promise<Session>

    findByUserId(id: string): Promise<Session[]>

    findById(id: string): Promise<Session | null>

    findByIdWithUser(id: string): Promise<SessionWithUserDTO | null>

    invalidate(sessionId: string): Promise<void>

    update(sessionId: string, data: Omit<CreateSessionDTO, "userId">): Promise<void>

    invalidateAllByUserId(userId: string): Promise<void>


}