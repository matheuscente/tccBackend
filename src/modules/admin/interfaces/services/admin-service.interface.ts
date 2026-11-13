import type { AdminDashboardDTO } from "../../DTOs/admin-dashboard.DTO"
import type { AdminUserOverviewDTO } from "../../DTOs/admin-user-overview.DTO"
import type { AdminSummaryDTO } from "../../DTOs/admin-summary.DTO"

export interface IAdminService {
    getDashboard(): Promise<AdminDashboardDTO>
    getUserOverview(userId: string): Promise<AdminUserOverviewDTO>
    listAdmins(): Promise<AdminSummaryDTO[]>
}
