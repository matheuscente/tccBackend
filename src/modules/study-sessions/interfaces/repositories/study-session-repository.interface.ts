import type { StudySession } from "@prisma/client"
import type { CreateStudySessionDTO } from "../../DTOs/create-study-session.DTO"

export interface IStudySessionRepository {
    findById(studySessionId: string): Promise<StudySession | null>
    findByIdWithOwner(studySessionId: string, userId: string): Promise<StudySession | null>
    findAllByUserId(userId: string): Promise<StudySession[]>
    create(data: CreateStudySessionDTO): Promise<StudySession>
    update(studySessionId: string, data: Partial<CreateStudySessionDTO>): Promise<StudySession>
    delete(studySessionId: string): Promise<void>
    deleteAllByCourseIds(courseIds: string[]): Promise<void>
    deleteAllByModuleIds(moduleIds: string[]): Promise<void>
    deleteAllByDisciplineIds(disciplineIds: string[]): Promise<void>
}