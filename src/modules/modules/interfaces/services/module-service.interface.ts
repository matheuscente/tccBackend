import type { AuthUserDTO } from "../../../../shared/DTOs/auth-user.DTO";
import type { CreateModuleDTO } from "../../DTOs/create-module.dto";
import type { ResponseModuleDTO } from "../../DTOs/response-module.dto";

export interface IModuleService {
  create(authUser: AuthUserDTO, data: CreateModuleDTO): Promise<ResponseModuleDTO>;

  findById(authUser: AuthUserDTO, moduleId: string): Promise<ResponseModuleDTO | null>;

  findAllByCourseId(authUser: AuthUserDTO, courseId: string): Promise<ResponseModuleDTO[]>;

findAllByUserId(
      authUser: AuthUserDTO,
      targetUserId: string,
    ): Promise<ResponseModuleDTO[]>

  update(authUser: AuthUserDTO, moduleId: string, data: Partial<CreateModuleDTO>): Promise<ResponseModuleDTO>;

  softDelete(authUser: AuthUserDTO, moduleId: string): Promise<void>;
}