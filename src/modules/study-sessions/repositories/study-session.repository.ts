import type { StudySession, Prisma, PrismaClient } from "@prisma/client";
import type { IStudySessionRepository } from "../interfaces/repositories/study-session-repository.interface";
import type { CreateStudySessionRepositoryDTO } from "../DTOs/start-study-session-repository-DTO";
import type { UpdateStudySessionDTO } from "../DTOs/update-study-session.DTO";

export class StudySessionRepository implements IStudySessionRepository {
    constructor(
        private readonly orm: PrismaClient | Prisma.TransactionClient,
    ) { }

    async findById(studySessionId: string): Promise<StudySession | null> {
        return this.orm.studySession.findUnique({
            where: { id: studySessionId }
        })
    }

    async findByIdWithOwner(studySessionId: string, userId: string): Promise<StudySession | null> {
        return this.orm.studySession.findFirst({
            where: { id: studySessionId, userId }
        })
    }

    async findAllByUserId(userId: string): Promise<StudySession[]> {
        return this.orm.studySession.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        })
    }

    async findActiveByUser(userId: string): Promise<StudySession[]> {
        return this.orm.studySession.findMany({
            where: {
                userId,
                status: "IN_PROGRESS"
            },
            orderBy: { createdAt: "desc" }
        })
    }


    async create(data: CreateStudySessionRepositoryDTO): Promise<StudySession> {
        return this.orm.studySession.create({ data })
    }

    async update(studySessionId: string, data: UpdateStudySessionDTO): Promise<StudySession> {
        return this.orm.studySession.update({
            where: { id: studySessionId },
            data
        })
    }

    async delete(studySessionId: string): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { id: studySessionId }
        })
    }

    async deleteAllByCourseIds(courseIds: string[]): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { courseId: { in: courseIds } }
        })
    }

    async deleteAllByModuleIds(moduleIds: string[]): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { moduleId: { in: moduleIds } }
        })
    }

    async deleteAllByDisciplineIds(disciplineIds: string[]): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { disciplineId: { in: disciplineIds } }
        })
    }

    async deleteAllByUserId(userId: string): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { userId }
        })
    }

    async findByGeneralScope(userId: string, startDate: Date, endDate: Date): Promise<StudySession[]> { }

    async findByCourseScope(userId: string, courseId: string, startDate: Date, endDate: Date): Promise<StudySession[]> { }
    
    async findByModuleScope(userId: string, moduleId: string, startDate: Date, endDate: Date): Promise<StudySession[]> { }
    
    async findByDisciplineScope(userId: string, disciplineId: string, startDate: Date, endDate: Date): Promise<StudySession[]> { }
}