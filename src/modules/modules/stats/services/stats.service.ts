import type { IStudySessionRepository } from "../../../study-sessions/interfaces/repositories/study-session-repository.interface";
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
    
}