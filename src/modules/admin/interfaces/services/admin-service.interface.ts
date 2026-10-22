import type { AdminDashboardDTO } from "../../DTOs/admin-dashboard.DTO"
import type { AdminUserOverviewDTO } from "../../DTOs/admin-user-overview.DTO"

export interface IAdminService {
    getDashboard(): Promise<AdminDashboardDTO>
    getUserOverview(userId: string): Promise<AdminUserOverviewDTO>
}
