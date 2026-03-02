import type { Module, Prisma, PrismaClient } from "@prisma/client";
import type { IModuleRepository } from "../interfaces/repositories/module-repository.interface";
import type { CreateModuleDTO } from "../DTOs/create-module.dto";

export class ModuleRepository implements IModuleRepository{
    constructor (
        private readonly orm: PrismaClient | Prisma.TransactionClient
    ) {}
    async findById(moduleId: string): Promise<Module | null> {
        return this.orm.module.findFirst({
            where: {id: moduleId,
                deletedAt: null
            }
        })
    }
    findAllByCourseId(courseId: string): Promise<Module[]> {
        return this.orm.module.findMany({
            where: {courseId,
                deletedAt: null
            }
        }) 
    }

    findAllByUserId(userId: string): Promise<Module[]> {
        return this.orm.module.findMany({
            where: {
                deletedAt: null,
                course: {
                    userId
                }
            }
        })
    }

    //buscar todos os modulos de um curso - usuario comum
    async findAllByCourseIdWithOwner(courseId: string, userId: string): Promise<Module[]> {
        return this.orm.module.findMany({
            where: {courseId,
                deletedAt: null,
                course: {
                    userId
                }
            }
        })
    }

    //buscar um modulo especifico - usuario comum
    async findByIdWithOwner(moduleId: string, userId: string): Promise<Module | null> {
         return this.orm.module.findFirst({
            where: {id: moduleId,
                deletedAt: null,
                course: {
                    userId
                }
            }
        })
    }


    create(data: CreateModuleDTO): Promise<Module> {
        return this.orm.module.create({
            data
        })
    }

    update(moduleId: string, data: Partial<CreateModuleDTO>): Promise<Module> {
        return this.orm.module.update({
            where: { id: moduleId,

             },
            data
        })
    }

    async softDelete(moduleId: string): Promise<void> {
        await this.orm.module.updateMany({
            where: {id: moduleId,
                deletedAt: null
            },

            data: {deletedAt: new Date()}
        })
    }
    async softDeleteAllByCourseIds(courseIds: string[]): Promise<void> {
        await this.orm.module.updateMany({
            where:{
                courseId: {in: courseIds},
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })

    }
    
}