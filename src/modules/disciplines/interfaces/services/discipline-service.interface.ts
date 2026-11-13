import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO";
import type { CreateDisciplineDTO } from "../../DTOs/create-discipline.DTO";
import type { ResponseDisciplineDTO } from "../../DTOs/response-discipline.DTO";

export interface IDisciplineService {
  create(authUser: AuthUserDTO, data: CreateDisciplineDTO): Promise<ResponseDisciplineDTO>;

  findById(authUser: AuthUserDTO, disciplineId: string): Promise<ResponseDisciplineDTO | null>;

  findAllByModuleId(authUser: AuthUserDTO, moduleId: string): Promise<ResponseDisciplineDTO[]>;

findAllByUserId(
      authUser: AuthUserDTO,
      targetUserId: string,
    ): Promise<ResponseDisciplineDTO[]>

  update(authUser: AuthUserDTO, disciplineId: string, data: Partial<CreateDisciplineDTO>): Promise<ResponseDisciplineDTO>;

  softDelete(authUser: AuthUserDTO, disciplineId: string): Promise<void>;
}