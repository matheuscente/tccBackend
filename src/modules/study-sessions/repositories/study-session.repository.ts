import type { StudySession, Prisma, PrismaClient } from "@prisma/client";
import type { CreateStudySessionDTO } from "../DTOs/create-study-session.DTO";
import type { IStudySessionRepository } from "../interfaces/repositories/study-session-repository.interface";
import type { UpdateStudySessionDTO } from "../DTOs/update-study-session.DTO";

export class StudySessionRepository implements IStudySessionRepository {
    constructor(
        private readonly orm: PrismaClient | Prisma.TransactionClient,
    ) { }

    async findById(StudySessionId: string): Promise<StudySession | null> {
        return this.orm.studySession.findUnique({
            where: { id: StudySessionId }
        })
    }

    async findByIdWithOwner(StudySessionId: string, userId: string): Promise<StudySession | null> {
        return this.orm.studySession.findFirst({
            where: { id: StudySessionId, userId }
        })
    }

    async findAllByUserId(userId: string): Promise<StudySession[]> {
        return this.orm.studySession.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        })
    }

    async create(data: CreateStudySessionDTO): Promise<StudySession> {
        return this.orm.studySession.create({ data })
    }

    async update(StudySessionId: string, data: UpdateStudySessionDTO): Promise<StudySession> {
        return this.orm.studySession.update({
            where: { id: StudySessionId },
            data
        })
    }

    async delete(StudySessionId: string): Promise<void> {
        await this.orm.studySession.deleteMany({
            where: { id: StudySessionId }
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

}