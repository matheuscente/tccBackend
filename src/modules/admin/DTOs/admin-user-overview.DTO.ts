export interface AdminUserOverviewDTO {
    user: { id: string, name: string, username: string, email: string, role: "ADMIN" | "USER", birthDate: string, createdAt: string }
    counts: { courses: number, modules: number, disciplines: number, goals: number, questions: number, activities: number, notes: number, files: number, tickets: number }
    study: { totalMinutes: number, minutesLast30Days: number, sessions: number, lastStudyAt: string | null }
    activities: { attempts: number, averageScore: number | null, bestScore: number | null }
    // notas e arquivos: apenas contagem e volume, sem acesso ao conteúdo (privacidade)
    storage: { files: number, bytes: number }
}
