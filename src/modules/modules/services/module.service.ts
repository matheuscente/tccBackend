import type { Module } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { Isanitize } from "../../../shared/sanitize/interfaces/sanitize.interface";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { CreateModuleDTO } from "../DTOs/create-module.dto";
import type { ResponseModuleDTO } from "../DTOs/response-module.dto";
import type { IModuleRepository } from "../interfaces/repositories/module-repository.interface";
import type { IModuleService } from "../interfaces/services/module-service.interface";
import type { ICourseRepository } from "../../courses/interfaces/repository/course-repository.interface";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";

export class ModuleService implements IModuleService {
    constructor(
        private readonly moduleRepository: IModuleRepository,
        private readonly courseRepository: ICourseRepository,
        private readonly sanitize: Isanitize,
        private readonly ownership: IOwnershipService,
        private readonly transaction: ITransaction
    ) { }


    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseModuleDTO[]> {
        // Se não for admin, só pode buscar o próprio usuário
        this.ownership.validateOwnership(authUser, targetUserId);

        const modules = await this.moduleRepository.findAllByUserId(targetUserId);

        if (modules.length === 0) return [];

        return modules.map((module) => this.mapResponse(module));
    }

    async create(authUser: AuthUserDTO, data: CreateModuleDTO): Promise<ResponseModuleDTO> {
        const course = await this.courseRepository.findById(data.courseId);

        if (!course) throw new NotFoundError("Curso não encontrado");

        this.ownership.validateOwnership(authUser, course.userId);

        const module = await this.moduleRepository.create({
            courseId: data.courseId,
            title: this.sanitize.sanitizeName(data.title),
            description: data.description ?? null,
        });

        return this.mapResponse(module);
    }

    async findById(authUser: AuthUserDTO, moduleId: string): Promise<ResponseModuleDTO | null> {
        const module = authUser.role === "ADMIN"
            ? await this.moduleRepository.findById(moduleId)
            : await this.moduleRepository.findByIdWithOwner(moduleId, authUser.id)

        if (!module) return null;

        return this.mapResponse(module);
    }

    async findAllByCourseId(authUser: AuthUserDTO, courseId: string): Promise<ResponseModuleDTO[]> {
        const modules = authUser.role === "ADMIN" ? await this.moduleRepository.findAllByCourseId(courseId) : await this.moduleRepository.findAllByCourseIdWithOwner(courseId, authUser.id)

        return modules.map((module) => this.mapResponse(module));
    }

    async update(authUser: AuthUserDTO, moduleId: string, data: Partial<CreateModuleDTO>): Promise<ResponseModuleDTO> {
        const module = await this.moduleRepository.findById(moduleId);
        if (!module) throw new NotFoundError("Módulo não encontrado");

        const course = await this.courseRepository.findById(module.courseId);
        if (!course) throw new NotFoundError("Curso não encontrado");

        this.ownership.validateOwnership(authUser, course.userId);

        const updatedModule = await this.moduleRepository.update(moduleId, {
            title: data.title ? this.sanitize.sanitizeName(data.title) : module.title,
            description: data.description !== undefined ? data.description : module.description,
        });

        return this.mapResponse(updatedModule);
    }

    async softDelete(authUser: AuthUserDTO, moduleId: string): Promise<void> {
        return this.transaction.execute(async (repositories) => {
            const module = authUser.role === "ADMIN"
                ? await repositories.moduleRepository.findById(moduleId)
                : await repositories.moduleRepository.findByIdWithOwner(moduleId, authUser.id)

            //método Idempotente. Se module já não existe, retorna null
            if (!module) return;

            await repositories.disciplineRepository.softDeleteAllByModuleIds([moduleId])
            await repositories.moduleRepository.softDelete(moduleId);
        })
    }

    private mapResponse(module: Module): ResponseModuleDTO {
        return {
            id: module.id,
            courseId: module.courseId,
            title: module.title,
            description: module.description,
            createdAt: module.createdAt.toISOString(),
            updatedAt: module.updatedAt.toISOString(),
        };
    }
}