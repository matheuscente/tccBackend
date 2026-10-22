import type { TicketStatus } from "@prisma/client"

export interface AdminDashboardDTO {
    users: { total: number, newLast30Days: number, activeLast7Days: number, admins: number }
    study: { totalMinutes: number, minutesLast30Days: number, sessionsLast30Days: number, perDay: { date: string, minutes: number }[] }
    content: { courses: number, modules: number, disciplines: number, goals: number, questions: number, activities: number, notes: number, files: number }
    activities: { attemptsLast30Days: number, averageScoreLast30Days: number | null }
    tickets: Record<TicketStatus, number>
    recentUsers: { id: string, name: string, username: string, email: string, createdAt: string }[]
}
