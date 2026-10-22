import type { AdminDashboardDTO } from "../../DTOs/admin-dashboard.DTO"
import type { AdminUserOverviewDTO } from "../../DTOs/admin-user-overview.DTO"

export interface IAdminRepository {
    getDashboard(today: Date): Promise<AdminDashboardDTO>
    getUserOverview(userId: string, today: Date): Promise<AdminUserOverviewDTO | null>
}
