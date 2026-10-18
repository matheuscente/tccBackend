import type { AdminDashboardDTO, AdminUserOverviewDTO } from "../DTOs/admin.DTO"

export interface IAdminRepository {
    getDashboard(today: Date): Promise<AdminDashboardDTO>
    getUserOverview(userId: string, today: Date): Promise<AdminUserOverviewDTO | null>
}

export interface IAdminService {
    getDashboard(): Promise<AdminDashboardDTO>
    getUserOverview(userId: string): Promise<AdminUserOverviewDTO>
}
