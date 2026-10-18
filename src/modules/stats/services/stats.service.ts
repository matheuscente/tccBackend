import type { Goal, StudySession } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IActivityRepository } from "../../activities/interfaces/repositories/activity-repository.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { IGoalRepository } from "../../goals/interfaces/repositories/goal-respository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { IStudySessionRepository } from "../../study-sessions/interfaces/repositories/study-session-repository.interface";
import type { GetStatsDTO, StatsQueryDTO } from "../DTOs/get-stats.DTO";
import type { GoalProgressDTO, GoalProgressStatus, PerformanceDTO, StudySummaryDTO } from "../DTOs/stats-response.DTO";
import type { StudyTimeByScopeDTO } from "../DTOs/study-time-by-scope.DTO";
import type { StudyTimePerDayDTO } from "../DTOs/study-time-per-day.DTO";
import type { IStatsService } from "../interfaces/services/stats-service.interface";

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_PERIOD_DAYS = 30
const MAX_PERIOD_DAYS = 366 * 2

export class StatsService implements IStatsService {
    constructor (
        private readonly studySessionRepository: IStudySessionRepository,
        private readonly ownership: IOwnershipService,
        private readonly dateUtils: IDateConvert,
        private readonly courseRepository: ICourseRepository,
        private readonly moduleRepository: IModuleRepository,
        private readonly disciplineRepository: IDisciplineRepository,
        private readonly goalRepository: IGoalRepository,
        private readonly activityRepository: IActivityRepository
    ) {}

    async getTotalStudyTime(data: GetStatsDTO): Promise<number> {
        const sessions = await this.getSessions(data)
        return this.sumMinutes(sessions)
    }

    async getStudyTimePerDay(data: GetStatsDTO): Promise<StudyTimePerDayDTO[]> {
        const sessions = await this.getSessions(data)
        return this.perDay(sessions, data.startDate, data.endDate ?? this.dateUtils.getCurrentDate())
    }

    async getStudyTimeByScope(data: GetStatsDTO): Promise<StudyTimeByScopeDTO[]> {
        const sessions = await this.getSessions(data)
        return this.byScope(sessions, data)
    }

    async getSummary(authUser: AuthUserDTO, query: StatsQueryDTO): Promise<StudySummaryDTO> {
        this.ownership.validateOwnership(authUser, query.userId)

        const { startDate, endDate } = this.resolvePeriod(query)

        const data: GetStatsDTO = {
            userId: query.userId,
            startDate,
            endDate,
            ...(query.courseId ? { courseId: query.courseId } : {}),
            ...(query.moduleId ? { moduleId: query.moduleId } : {}),
            ...(query.disciplineId ? { disciplineId: query.disciplineId } : {})
        }

        const sessions = await this.getSessions(data)
        const perDay = this.perDay(sessions, startDate, endDate)
        const totalMinutes = this.sumMinutes(sessions)
        const studiedDays = perDay.filter(day => day.minutes > 0).length

        // dias seguidos com estudo, contando de trás para frente a partir do fim do período
        const todayKey = this.dayKey(this.dateUtils.getCurrentDate())
        let currentStreak = 0
        for (let index = perDay.length - 1; index >= 0; index--) {
            const day = perDay[index]!
            if (day.minutes > 0) currentStreak++
            else if (index === perDay.length - 1 && day.date === todayKey) continue // hoje ainda pode não ter estudo
            else break
        }

        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalMinutes,
            sessionsCount: sessions.length,
            averageMinutesPerDay: perDay.length ? Math.round(totalMinutes / perDay.length) : 0,
            studiedDays,
            currentStreak,
            perDay,
            byScope: await this.byScope(sessions, data)
        }
    }

    async getGoalsProgress(authUser: AuthUserDTO, userId: string): Promise<GoalProgressDTO[]> {
        this.ownership.validateOwnership(authUser, userId)

        const goals = await this.goalRepository.findAllByUserId(userId)
        const today = this.dateUtils.getCurrentDate()

        return Promise.all(goals.map(goal => this.goalProgress(goal, today)))
    }

    async getPerformance(authUser: AuthUserDTO, query: StatsQueryDTO): Promise<PerformanceDTO> {
        this.ownership.validateOwnership(authUser, query.userId)

        const since = query.startDate ? this.dateUtils.dateFormat(query.startDate) : undefined
        const until = query.endDate ? new Date(this.dateUtils.dateFormat(query.endDate).getTime() + DAY_MS) : undefined
        const attempts = await this.activityRepository.findAttemptsByUserId(query.userId, since)

        // filtro hierárquico: um curso inclui as atividades dos seus módulos e disciplinas
        const needsTree = !!(query.courseId || query.moduleId)
        const [modules, disciplines] = needsTree
            ? await Promise.all([
                this.moduleRepository.findAllByUserId(query.userId),
                this.disciplineRepository.findAllByUserId(query.userId)
            ])
            : [[], []]
        const moduleCourse = new Map(modules.map(module => [module.id, module.courseId]))
        const disciplineModule = new Map(disciplines.map(discipline => [discipline.id, discipline.moduleId]))

        const filtered = attempts.filter(attempt => {
            if (until && attempt.finishedAt >= until) return false

            const { courseId, moduleId, disciplineId } = attempt.activity
            const resolvedModule = moduleId ?? (disciplineId ? disciplineModule.get(disciplineId) ?? null : null)
            const resolvedCourse = courseId ?? (resolvedModule ? moduleCourse.get(resolvedModule) ?? null : null)

            if (query.disciplineId) return disciplineId === query.disciplineId
            if (query.moduleId) return resolvedModule === query.moduleId
            if (query.courseId) return resolvedCourse === query.courseId
            return true
        })

        const scores = filtered.map(attempt => attempt.score)

        const grouped = new Map<string, { title: string, scores: number[] }>()
        filtered.forEach(attempt => {
            const entry = grouped.get(attempt.activityId) ?? { title: attempt.activity.title, scores: [] }
            entry.scores.push(attempt.score)
            grouped.set(attempt.activityId, entry)
        })

        return {
            totalAttempts: filtered.length,
            averageScore: scores.length ? this.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
            bestScore: scores.length ? Math.max(...scores) : null,
            timeline: filtered.map(attempt => ({
                attemptId: attempt.id,
                activityId: attempt.activityId,
                activityTitle: attempt.activity.title,
                date: attempt.finishedAt.toISOString(),
                score: attempt.score
            })),
            byActivity: Array.from(grouped.entries()).map(([activityId, entry]) => ({
                activityId,
                title: entry.title,
                attempts: entry.scores.length,
                averageScore: this.round(entry.scores.reduce((a, b) => a + b, 0) / entry.scores.length),
                bestScore: Math.max(...entry.scores),
                lastScore: entry.scores[entry.scores.length - 1]!
            }))
        }
    }

    private async goalProgress(goal: Goal, today: Date): Promise<GoalProgressDTO> {
        const start = this.dateUtils.normalize(goal.startDate)
        const end = goal.endDate ? this.dateUtils.normalize(goal.endDate) : null

        const base = {
            goalId: goal.id,
            title: goal.title,
            type: goal.type,
            targetMinutes: goal.targetMinutes,
            startDate: goal.startDate.toISOString(),
            endDate: goal.endDate ? goal.endDate.toISOString() : null,
            scope: { courseId: goal.courseId, moduleId: goal.moduleId, disciplineId: goal.disciplineId }
        }

        const scopeData = {
            userId: goal.userId,
            ...(goal.courseId ? { courseId: goal.courseId } : {}),
            ...(goal.moduleId ? { moduleId: goal.moduleId } : {}),
            ...(goal.disciplineId ? { disciplineId: goal.disciplineId } : {})
        }

        if (today < start) {
            return { ...base, studiedMinutes: 0, percent: 0, status: "NOT_STARTED" }
        }

        if (goal.type === "DAILY_ONCE") {
            const sessions = await this.getSessions({ ...scopeData, startDate: start, endDate: start })
            const studied = this.sumMinutes(sessions)
            const status: GoalProgressStatus = studied >= goal.targetMinutes
                ? "ACHIEVED"
                : today.getTime() > start.getTime() ? "EXPIRED" : "IN_PROGRESS"

            return { ...base, studiedMinutes: studied, percent: this.percent(studied, goal.targetMinutes), status }
        }

        if (goal.type === "DAILY_RECURRING") {
            const lastDay = end && end < today ? end : today
            const sessions = await this.getSessions({ ...scopeData, startDate: start, endDate: lastDay })
            const days = this.perDay(sessions, start, lastDay)
            const daysAchieved = days.filter(day => day.minutes >= goal.targetMinutes).length
            const studiedToday = days[days.length - 1]?.minutes ?? 0
            const finished = !!end && end < today

            const status: GoalProgressStatus = finished
                ? (daysAchieved === days.length ? "ACHIEVED" : "EXPIRED")
                : (studiedToday >= goal.targetMinutes ? "ACHIEVED" : "IN_PROGRESS")

            return {
                ...base,
                studiedMinutes: finished ? this.sumMinutes(sessions) : studiedToday,
                percent: finished ? this.percent(daysAchieved, days.length) : this.percent(studiedToday, goal.targetMinutes),
                status,
                daysAchieved,
                totalDays: days.length
            }
        }

        // TOTAL_BY_DATE e TOTAL_IN_PERIOD: soma do período (até hoje ou até a data final)
        const lastDay = end && end < today ? end : today
        const sessions = await this.getSessions({ ...scopeData, startDate: start, endDate: lastDay })
        const studied = this.sumMinutes(sessions)

        const status: GoalProgressStatus = studied >= goal.targetMinutes
            ? "ACHIEVED"
            : end && end < today ? "EXPIRED" : "IN_PROGRESS"

        return { ...base, studiedMinutes: studied, percent: this.percent(studied, goal.targetMinutes), status }
    }

    private resolvePeriod(query: StatsQueryDTO): { startDate: Date, endDate: Date } {
        const today = this.dateUtils.getCurrentDate()
        const endDate = query.endDate ? this.dateUtils.dateFormat(query.endDate) : today
        const startDate = query.startDate
            ? this.dateUtils.dateFormat(query.startDate)
            : new Date(endDate.getTime() - (DEFAULT_PERIOD_DAYS - 1) * DAY_MS)

        if (startDate > endDate) throw new ValidationError("A data inicial não pode ser maior que a data final")

        if ((endDate.getTime() - startDate.getTime()) / DAY_MS > MAX_PERIOD_DAYS) {
            throw new ValidationError("O período máximo é de 2 anos")
        }

        return { startDate, endDate }
    }

    private perDay(sessions: StudySession[], start: Date, end: Date): StudyTimePerDayDTO[] {
        const totals = new Map<string, number>()
        sessions.forEach(session => {
            const key = this.dayKey(session.studiedAt)
            totals.set(key, (totals.get(key) ?? 0) + session.minutes)
        })

        const days: StudyTimePerDayDTO[] = []
        for (let time = this.dateUtils.normalize(start).getTime(); time <= this.dateUtils.normalize(end).getTime(); time += DAY_MS) {
            const key = this.dayKey(new Date(time))
            days.push({ date: key, minutes: totals.get(key) ?? 0 })
        }

        return days
    }

    /**
     * Agrupa no nível abaixo do filtro: geral => cursos, curso => módulos, módulo => disciplinas.
     */
    private async byScope(sessions: StudySession[], data: GetStatsDTO): Promise<StudyTimeByScopeDTO[]> {
        if (sessions.length === 0) return []

        const [courses, modules, disciplines] = await Promise.all([
            this.courseRepository.findAllByUserId(data.userId),
            this.moduleRepository.findAllByUserId(data.userId),
            this.disciplineRepository.findAllByUserId(data.userId)
        ])

        const moduleById = new Map(modules.map(module => [module.id, module]))
        const disciplineById = new Map(disciplines.map(discipline => [discipline.id, discipline]))
        const courseTitle = new Map(courses.map(course => [course.id, course.title]))

        const groups = new Map<string, StudyTimeByScopeDTO>()

        const add = (scopeId: string, scope: StudyTimeByScopeDTO["scope"], title: string, minutes: number) => {
            const current = groups.get(`${scope}:${scopeId}`) ?? { scopeId, scope, title, minutes: 0 }
            current.minutes += minutes
            groups.set(`${scope}:${scopeId}`, current)
        }

        sessions.forEach(session => {
            const discipline = session.disciplineId ? disciplineById.get(session.disciplineId) : undefined
            const moduleId = session.moduleId ?? discipline?.moduleId ?? null
            const module = moduleId ? moduleById.get(moduleId) : undefined
            const courseId = session.courseId ?? module?.courseId ?? null

            if (data.disciplineId || data.moduleId) {
                if (discipline) add(discipline.id, "discipline", discipline.title, session.minutes)
                else if (module) add(module.id, "module", `${module.title} (geral)`, session.minutes)
                return
            }

            if (data.courseId) {
                if (module) add(module.id, "module", module.title, session.minutes)
                else if (courseId) add(courseId, "course", `${courseTitle.get(courseId) ?? "Curso"} (geral)`, session.minutes)
                return
            }

            if (courseId) add(courseId, "course", courseTitle.get(courseId) ?? "Curso removido", session.minutes)
        })

        return Array.from(groups.values()).sort((a, b) => b.minutes - a.minutes)
    }

    private sumMinutes(sessions: StudySession[]): number {
        return sessions.reduce((total, session) => total + session.minutes, 0)
    }

    private percent(value: number, target: number): number {
        if (target <= 0) return 0
        return Math.min(100, Math.round((value / target) * 100))
    }

    private round(value: number): number {
        return Math.round(value * 100) / 100
    }

    private dayKey(date: Date): string {
        return date.toISOString().slice(0, 10)
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
