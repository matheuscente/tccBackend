import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { AdminDashboardDTO, AdminUserOverviewDTO } from "../DTOs/admin.DTO";
import type { IAdminRepository, IAdminService } from "../interfaces/admin-repository.interface";

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
