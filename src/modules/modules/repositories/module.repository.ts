import type { Module, Prisma, PrismaClient } from "@prisma/client";
import type { IModuleRepository } from "../interfaces/repositories/module-repository.interface";
import type { CreateModuleDTO } from "../DTOs/create-module.dto";

export class ModuleRepository implements IModuleRepository{
    constructor (
        private readonly orm: PrismaClient | Prisma.TransactionClient
    ) {}
    findById(moduleId: string): Promise<Module | null> {
        throw new Error("Method not implemented.");
    }
    findAllByCourseId(courseId: string): Promise<Module[]> {
        throw new Error("Method not implemented.");
    }
    findAllByUserId(userId: string): Promise<Module[]> {
        throw new Error("Method not implemented.");
    }
    create(data: CreateModuleDTO): Promise<Module> {
        throw new Error("Method not implemented.");
    }
    update(moduleId: string, data: Partial<CreateModuleDTO>): Promise<Module> {
        throw new Error("Method not implemented.");
    }
    softDelete(moduleId: string): Promise<void> {
        throw new Error("Method not implemented.");
    }
    async softDeleteAllByCourseId(courseId: string[]): Promise<void> {
        await this.orm.module.updateMany({
            where:{
                courseId: {in: courseId}
            },
            data: {
                deletedAt: new Date()
            }
        })

    }
    
}