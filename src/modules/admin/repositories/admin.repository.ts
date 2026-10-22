import type { Prisma, PrismaClient, TicketStatus } from "@prisma/client";
import type { AdminDashboardDTO } from "../DTOs/admin-dashboard.DTO";
import type { AdminUserOverviewDTO } from "../DTOs/admin-user-overview.DTO";
import type { IAdminRepository } from "../interfaces/repositories/admin-repository.interface";

const DAY_MS = 24 * 60 * 60 * 1000

export class AdminRepository implements IAdminRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    async getDashboard(today: Date): Promise<AdminDashboardDTO> {
        const last30 = new Date(today.getTime() - 29 * DAY_MS)
        const last7 = new Date(today.getTime() - 6 * DAY_MS)
        const activeUser = { deletedAt: null }

        const [
            totalUsers, newUsers, admins, activeUsers,
            totalMinutes, last30Sessions,
            courses, modules, disciplines, goals, questions, activities, notes, files,
            attempts, ticketGroups, recentUsers
        ] = await Promise.all([
            this.orm.user.count({ where: activeUser }),
            this.orm.user.count({ where: { ...activeUser, createdAt: { gte: last30 } } }),
            this.orm.user.count({ where: { ...activeUser, role: "ADMIN" } }),
            this.orm.studySession.groupBy({ by: ["userId"], where: { studiedAt: { gte: last7 } } }),
            this.orm.studySession.aggregate({ where: { status: "COMPLETED" }, _sum: { minutes: true } }),
            this.orm.studySession.findMany({
                where: { status: "COMPLETED", studiedAt: { gte: last30 } },
                select: { minutes: true, studiedAt: true }
            }),
            this.orm.course.count({ where: { deletedAt: null } }),
            this.orm.module.count({ where: { deletedAt: null } }),
            this.orm.discipline.count({ where: { deletedAt: null } }),
            this.orm.goal.count(),
            this.orm.question.count({ where: { deletedAt: null } }),
            this.orm.activity.count({ where: { deletedAt: null } }),
            this.orm.note.count({ where: { deletedAt: null } }),
            this.orm.storedFile.count(),
            this.orm.activityAttempt.aggregate({ where: { finishedAt: { gte: last30 } }, _count: { _all: true }, _avg: { score: true } }),
            this.orm.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
            this.orm.user.findMany({
                where: activeUser,
                orderBy: { createdAt: "desc" },
                take: 5,
                select: { id: true, name: true, username: true, email: true, createdAt: true }
            })
        ])

        const perDayMap = new Map<string, number>()
        last30Sessions.forEach(session => {
            const key = session.studiedAt.toISOString().slice(0, 10)
            perDayMap.set(key, (perDayMap.get(key) ?? 0) + session.minutes)
        })

        const perDay: { date: string, minutes: number }[] = []
        for (let time = last30.getTime(); time <= today.getTime(); time += DAY_MS) {
            const key = new Date(time).toISOString().slice(0, 10)
            perDay.push({ date: key, minutes: perDayMap.get(key) ?? 0 })
        }

        const tickets: Record<TicketStatus, number> = { OPEN: 0, IN_PROGRESS: 0, ANSWERED: 0, CLOSED: 0 }
        ticketGroups.forEach(group => { tickets[group.status] = group._count._all })

        return {
            users: { total: totalUsers, newLast30Days: newUsers, activeLast7Days: activeUsers.length, admins },
            study: {
                totalMinutes: totalMinutes._sum.minutes ?? 0,
                minutesLast30Days: last30Sessions.reduce((sum, session) => sum + session.minutes, 0),
                sessionsLast30Days: last30Sessions.length,
                perDay
            },
            content: { courses, modules, disciplines, goals, questions, activities, notes, files },
            activities: {
                attemptsLast30Days: attempts._count._all,
                averageScoreLast30Days: attempts._avg.score !== null ? Math.round(attempts._avg.score * 100) / 100 : null
            },
            tickets,
            recentUsers: recentUsers.map(user => ({ ...user, createdAt: user.createdAt.toISOString() }))
        }
    }

    async getUserOverview(userId: string, today: Date): Promise<AdminUserOverviewDTO | null> {
        const user = await this.orm.user.findFirst({ where: { id: userId, deletedAt: null } })
        if (!user) return null

        const last30 = new Date(today.getTime() - 29 * DAY_MS)

        const [
            courses, modules, disciplines, goals, questions, activities, notes, files,
            tickets, totalStudy, last30Study, lastSession, attempts, storage
        ] = await Promise.all([
            this.orm.course.count({ where: { userId, deletedAt: null } }),
            this.orm.module.count({ where: { deletedAt: null, course: { userId, deletedAt: null } } }),
            this.orm.discipline.count({ where: { deletedAt: null, module: { deletedAt: null, course: { userId, deletedAt: null } } } }),
            this.orm.goal.count({ where: { userId } }),
            this.orm.question.count({ where: { userId, deletedAt: null } }),
            this.orm.activity.count({ where: { userId, deletedAt: null } }),
            this.orm.note.count({ where: { userId, deletedAt: null } }),
            this.orm.storedFile.count({ where: { userId } }),
            this.orm.ticket.count({ where: { userId } }),
            this.orm.studySession.aggregate({ where: { userId, status: "COMPLETED" }, _sum: { minutes: true }, _count: { _all: true } }),
            this.orm.studySession.aggregate({ where: { userId, status: "COMPLETED", studiedAt: { gte: last30 } }, _sum: { minutes: true } }),
            this.orm.studySession.findFirst({ where: { userId, status: "COMPLETED" }, orderBy: { studiedAt: "desc" }, select: { studiedAt: true } }),
            this.orm.activityAttempt.aggregate({ where: { userId }, _count: { _all: true }, _avg: { score: true }, _max: { score: true } }),
            this.orm.storedFile.aggregate({ where: { userId }, _sum: { size: true } })
        ])

        return {
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                birthDate: user.birthDate.toISOString(),
                createdAt: user.createdAt.toISOString()
            },
            counts: { courses, modules, disciplines, goals, questions, activities, notes, files, tickets },
            study: {
                totalMinutes: totalStudy._sum.minutes ?? 0,
                minutesLast30Days: last30Study._sum.minutes ?? 0,
                sessions: totalStudy._count._all,
                lastStudyAt: lastSession ? lastSession.studiedAt.toISOString() : null
            },
            activities: {
                attempts: attempts._count._all,
                averageScore: attempts._avg.score !== null ? Math.round(attempts._avg.score * 100) / 100 : null,
                bestScore: attempts._max.score
            },
            storage: { files, bytes: storage._sum.size ?? 0 }
        }
    }
}
