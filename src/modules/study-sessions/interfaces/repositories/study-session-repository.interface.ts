import type { StudySession } from "@prisma/client"
import type { CreateStudySessionRepositoryDTO } from "../../DTOs/start-study-session-repository-DTO"
import type { UpdateStudySessionDTO } from "../../DTOs/update-study-session.DTO"

export interface IStudySessionRepository {
    findById(studySessionId: string): Promise<StudySession | null>
    findByIdWithOwner(studySessionId: string, userId: string): Promise<StudySession | null>
    findAllByUserId(userId: string): Promise<StudySession[]>
    create(data: CreateStudySessionRepositoryDTO): Promise<StudySession>
    update(studySessionId: string, data: UpdateStudySessionDTO): Promise<StudySession>
    delete(studySessionId: string): Promise<void>
    deleteAllByCourseIds(courseIds: string[]): Promise<void>
    deleteAllByModuleIds(moduleIds: string[]): Promise<void>
    deleteAllByDisciplineIds(disciplineIds: string[]): Promise<void>,
    deleteAllByUserId(userId: string): Promise<void>,
    findActiveByUser(userId: string): Promise<StudySession[]>
    findByGeneralScope(
    userId: string,
    startDate: Date,
    endDate?: Date | null
): Promise<StudySession[]>
    
    findByCourseScope(
    userId: string,
    courseId: string,
    startDate: Date,
    endDate?: Date | null
): Promise<StudySession[]>

findByModuleScope(
    userId: string,
    moduleId: string,
    startDate: Date,
    endDate?: Date | null
): Promise<StudySession[]>

findByDisciplineScope(
    userId: string,
    disciplineId: string,
    startDate: Date,
    endDate?: Date | null
): Promise<StudySession[]>

}