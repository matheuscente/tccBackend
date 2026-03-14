import type { Discipline, Prisma, PrismaClient } from "@prisma/client"
import type { IDisciplineRepository } from "../interfaces/repositories/discipline-repository.interface"
import type { CreateDisciplineDTO } from "../DTOs/create-discipline.DTO"
import type { DisciplineWithCourseDTO } from "../DTOs/discipline-with-course-DTO"

export class DisciplineRepository implements IDisciplineRepository{
    constructor (
        private readonly orm: PrismaClient | Prisma.TransactionClient
    ) {}
    async findById(disciplineId: string): Promise<Discipline | null> {
        return this.orm.discipline.findFirst({
            where: {id: disciplineId,
                deletedAt: null
            }
        })
    }
    findAllByModuleId(moduleId: string): Promise<Discipline[]> {
        return this.orm.discipline.findMany({
            where: {moduleId,
                deletedAt: null
            }
        }) 
    }

    findAllByUserId(userId: string): Promise<Discipline[]> {
        return this.orm.discipline.findMany({
            where: {
                deletedAt: null,
                module: {
                    course: {
                        userId
                    }
                }
            }
        })
    }

    //buscar todos os modulos de um curso - usuario comum
    async findAllByModuleIdWithOwner(moduleId: string, userId: string): Promise<Discipline[]> {
        return this.orm.discipline.findMany({
            where: {moduleId,
                deletedAt: null,
                module: {
                    course: {
                        userId
                    }
                }
            }
        })
    }

    //buscar uma disciplina especifico - usuario comum
    async findByIdWithOwner(disciplineId: string, userId: string): Promise<Discipline | null> {
         return this.orm.discipline.findFirst({
            where: {id: disciplineId,
                deletedAt: null,
                module: {
                    course: {
                        userId
                    }
                }
            }
        })
    }

    async findByIdWithCourse(disciplineId: string): Promise<DisciplineWithCourseDTO | null> {
    return this.orm.discipline.findFirst({
        where: { id: disciplineId, deletedAt: null },
        include: {
            module: {
                select: {
                    course: {
                        select: { userId: true }
                    }
                }
            }
        }
    })
}


    create(data: CreateDisciplineDTO): Promise<Discipline> {
        return this.orm.discipline.create({
            data
        })
    }

    update(disciplineId: string, data: Partial<CreateDisciplineDTO>): Promise<Discipline> {
        return this.orm.discipline.update({
            where: { id: disciplineId,

             },
            data
        })
    }

    async softDelete(disciplineId: string): Promise<void> {
        await this.orm.discipline.updateMany({
            where: {id: disciplineId,
                deletedAt: null
            },

            data: {deletedAt: new Date()}
        })
    }
    async softDeleteAllByModuleIds(moduleIds: string[]): Promise<void> {
        await this.orm.discipline.updateMany({
            where:{
                moduleId: {in: moduleIds},
                deletedAt: null
            },
            data: {
                deletedAt: new Date()
            }
        })

    }
    
}