import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { AdminDashboardDTO } from "../DTOs/admin-dashboard.DTO";
import type { AdminUserOverviewDTO } from "../DTOs/admin-user-overview.DTO";
import type { IAdminRepository } from "../interfaces/repositories/admin-repository.interface";
import type { IAdminService } from "../interfaces/services/admin-service.interface";

export class AdminService implements IAdminService {
    constructor(
        private readonly adminRepository: IAdminRepository,
        private readonly dateUtils: IDateConvert
    ) { }

    getDashboard(): Promise<AdminDashboardDTO> {
        return this.adminRepository.getDashboard(this.dateUtils.getCurrentDate())
    }

    async getUserOverview(userId: string): Promise<AdminUserOverviewDTO> {
        const overview = await this.adminRepository.getUserOverview(userId, this.dateUtils.getCurrentDate())
        if (!overview) throw new NotFoundError("Usuário não encontrado")
        return overview
    }
}
