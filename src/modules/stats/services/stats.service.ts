import type { StudySession } from "@prisma/client";
import type { IStudySessionRepository } from "../../study-sessions/interfaces/repositories/study-session-repository.interface";
import type { GetStatsDTO } from "../DTOs/get-stats.DTO";
import type { StudyTimeByScopeDTO } from "../DTOs/study-time-by-scope.DTO";
import type { StudyTimePerDayDTO } from "../DTOs/study-time-per-day.DTO";
import type { IStatsService } from "../interfaces/services/stats-service.interface";

export class StatsService implements IStatsService {
    constructor (
        private readonly studySessionRepository: IStudySessionRepository
    ) {}
    getTotalStudyTime(data: GetStatsDTO): Promise<number> {
        throw new Error("Method not implemented.");
    }
    getStudyTimePerDay(data: GetStatsDTO): Promise<StudyTimePerDayDTO[]> {
        throw new Error("Method not implemented.");
    }
    getStudyTimeByScope(data: GetStatsDTO): Promise<StudyTimeByScopeDTO[]> {
        throw new Error("Method not implemented.");
    }
    
    private async getSessions(data: GetStatsDTO): Promise<StudySession[]> {
        if(data.courseId) return this.studySessionRepository.findByCourseScope(
            data.userId,
            data.courseId,
            data.startDate,
            data.endDate
        )

        if(data.disciplineId) return this.studySessionRepository.findByDisciplineScope(
            data.userId,
            data.disciplineId,
            data.startDate,
            data.endDate
        )
        if(data.moduleId) return this.studySessionRepository.findByModuleScope(
            data.userId,
            data.moduleId,
            data.startDate,
            data.endDate
        )

        return this.studySessionRepository.findByGeneralScope(
            data.userId,
            data.startDate,
            data.endDate
        )
    }
}