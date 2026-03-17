import type { Discipline } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { CreateDisciplineDTO } from "../DTOs/create-discipline.DTO";
import type { ResponseDisciplineDTO } from "../DTOs/response-discipline.DTO";
import type { IDisciplineRepository } from "../interfaces/repositories/discipline-repository.interface";
import type { IDisciplineService } from "../interfaces/services/discipline-service.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";

export class DisciplineService implements IDisciplineService {
    constructor(
        private readonly disciplineRepository: IDisciplineRepository,
        private readonly moduleRepository: IModuleRepository,
        private readonly sanitize: Isanitize,
        private readonly ownership: IOwnershipService,
        private readonly transaction: ITransaction
    ) { }


    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseDisciplineDTO[]> {
        // Se não for admin, só pode buscar o próprio usuário
        this.ownership.validateOwnership(authUser, targetUserId);

        const disciplines = await this.disciplineRepository.findAllByUserId(targetUserId);

        return disciplines.map((discipline) => this.mapResponse(discipline));
    }

    async create(authUser: AuthUserDTO, data: CreateDisciplineDTO): Promise<ResponseDisciplineDTO> {
        const module = await this.moduleRepository.findByIdWithCourse(data.moduleId);

        if (!module) throw new NotFoundError("Modulo não encontrado");

        this.ownership.validateOwnership(authUser, module.course.userId);

        const discipline = await this.disciplineRepository.create({
            moduleId: module.id,
            title: this.sanitize.sanitizeName(data.title),
            description: data.description ?? null,
        });

        return this.mapResponse(discipline);
    }

    async findById(authUser: AuthUserDTO, disciplineId: string): Promise<ResponseDisciplineDTO | null> {
        const discipline = authUser.role === "ADMIN"
            ? await this.disciplineRepository.findById(disciplineId)
            : await this.disciplineRepository.findByIdWithOwner(disciplineId, authUser.id)

        if (!discipline) return null;

        return this.mapResponse(discipline);
    }

    async findAllByModuleId(authUser: AuthUserDTO, moduleId: string): Promise<ResponseDisciplineDTO[]> {
        const disciplines = authUser.role === "ADMIN" ? await this.disciplineRepository.findAllByModuleId(moduleId) : await this.disciplineRepository.findAllByModuleIdWithOwner(moduleId, authUser.id)

        return disciplines.map((discipline) => this.mapResponse(discipline));
    }

    async update(authUser: AuthUserDTO, disciplineId: string, data: Partial<CreateDisciplineDTO>): Promise<ResponseDisciplineDTO> {
        const discipline = await this.disciplineRepository.findByIdWithCourse(disciplineId);
        if (!discipline) throw new NotFoundError("Disciplina não encontrada");

        this.ownership.validateOwnership(authUser, discipline.module.course.userId);

        const updatedDiscipline = await this.disciplineRepository.update(disciplineId, {
            title: data.title ? this.sanitize.sanitizeName(data.title) : discipline.title,
            description: data.description !== undefined ? data.description : discipline.description,
        });

        return this.mapResponse(updatedDiscipline);
    }

    async softDelete(authUser: AuthUserDTO, disciplineId: string): Promise<void> {
        return this.transaction.execute(async (repositories) => {
            const discipline = authUser.role === "ADMIN"
                ? await repositories.disciplineRepository.findById(disciplineId)
                : await repositories.disciplineRepository.findByIdWithOwner(disciplineId, authUser.id)

            //método Idempotente. Se discipline já não existe, retorna null
            if (!discipline) return;

            await repositories.goalRepository.deleteAllByDisciplineIds([disciplineId])
            await repositories.disciplineRepository.softDelete(disciplineId);
        })
    }

    private mapResponse(discipline: Discipline): ResponseDisciplineDTO {
        return {
            id: discipline.id,
            moduleId: discipline.moduleId,
            title: discipline.title,
            description: discipline.description,
            createdAt: discipline.createdAt.toISOString(),
            updatedAt: discipline.updatedAt.toISOString(),
        };
    }
}