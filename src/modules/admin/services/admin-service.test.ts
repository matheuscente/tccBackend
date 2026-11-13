import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";
import type { AdminDashboardDTO } from "../DTOs/admin-dashboard.DTO";
import type { AdminUserOverviewDTO } from "../DTOs/admin-user-overview.DTO";
import type { IAdminRepository } from "../interfaces/repositories/admin-repository.interface";
import { AdminService } from "./admin.service";

describe("AdminService", () => {
  const today = new Date("2026-10-30T12:00:00.000Z");

  const adminRepositoryMock: jest.Mocked<IAdminRepository> = {
    getDashboard: jest.fn(),
    getUserOverview: jest.fn(),
    findAdmins: jest.fn(),
  };

  const dateUtilsMock: jest.Mocked<IDateConvert> = {
    dateToSeconds: jest.fn(),
    extractDate: jest.fn(),
    dateFormat: jest.fn(),
    getCurrentDate: jest.fn(),
    secondsToDate: jest.fn(),
    normalize: jest.fn(),
    startOfDayInTimeZone: jest.fn(),
  };

  const service = new AdminService(adminRepositoryMock, dateUtilsMock);

  beforeEach(() => {
    jest.clearAllMocks();
    dateUtilsMock.getCurrentDate.mockReturnValue(today);
  });

  describe("getDashboard", () => {
    it("deve buscar o painel usando a data atual", async () => {
      const dashboard = { totals: { users: 3 } } as unknown as AdminDashboardDTO;
      adminRepositoryMock.getDashboard.mockResolvedValue(dashboard);

      const result = await service.getDashboard();

      expect(dateUtilsMock.getCurrentDate).toHaveBeenCalledTimes(1);
      expect(adminRepositoryMock.getDashboard).toHaveBeenCalledWith(today);
      expect(result).toBe(dashboard);
    });

    it("deve propagar erro do repositório", async () => {
      adminRepositoryMock.getDashboard.mockRejectedValue(new Error("falha no banco"));

      await expect(service.getDashboard()).rejects.toThrow("falha no banco");
    });
  });

  describe("listAdmins", () => {
    it("deve listar os administradores ativos", async () => {
      const admins = [{ id: "a", name: "Ana", username: "ana" }];
      adminRepositoryMock.findAdmins.mockResolvedValue(admins);

      await expect(service.listAdmins()).resolves.toBe(admins);
    });
  });

  describe("getUserOverview", () => {
    it("deve retornar o acompanhamento do usuário", async () => {
      const overview = { user: { id: "user-1" } } as unknown as AdminUserOverviewDTO;
      adminRepositoryMock.getUserOverview.mockResolvedValue(overview);

      const result = await service.getUserOverview("user-1");

      expect(adminRepositoryMock.getUserOverview).toHaveBeenCalledWith("user-1", today);
      expect(result).toBe(overview);
    });

    it("deve lançar NotFoundError quando o usuário não existir", async () => {
      adminRepositoryMock.getUserOverview.mockResolvedValue(null);

      await expect(service.getUserOverview("inexistente")).rejects.toBeInstanceOf(NotFoundError);
      await expect(service.getUserOverview("inexistente")).rejects.toThrow("Usuário não encontrado");
    });
  });
});
