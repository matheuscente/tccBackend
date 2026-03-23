import type { Module, Prisma, PrismaClient } from "@prisma/client";
import type { IModuleRepository } from "../interfaces/repositories/module-repository.interface";
import type { CreateModuleDTO } from "../DTOs/create-module.dto";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { ModuleWithCourseDTO } from "../DTOs/module-with-course.DTO";

export class ModuleRepository implements IModuleRepository {
  constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) {}
  async findById(moduleId: string): Promise<Module | null> {
    return this.orm.module.findFirst({
      where: { id: moduleId, deletedAt: null },
    });
  }


  async findAllByCourseId(courseId: string): Promise<Module[]> {
    return this.orm.module.findMany({
      where: { courseId, deletedAt: null },
    });
  }

  async findByIdWithCourse(moduleId: string): Promise<ModuleWithCourseDTO | null> {
    return this.orm.module.findFirst({
      where: {
        deletedAt: null,
        id: moduleId
      },
      include:{
        course: {
          select: {userId: true}
        }
      }
    })
  }

  findAllByUserId(userId: string): Promise<Module[]> {
    return this.orm.module.findMany({
      where: {
        deletedAt: null,
        course: {
          userId,
        },
      },
    });
  }

  async findAllByCourseIdWithOwner(
    courseId: string,
    userId: string,
  ): Promise<Module[]> {
    return this.orm.module.findMany({
      where: {
        courseId,
        deletedAt: null,
        course: {
          userId,
        },
      },
    });
  }

  async findByIdWithOwner(
    moduleId: string,
    userId: string,
  ): Promise<Module | null> {
    return this.orm.module.findFirst({
      where: {
        id: moduleId,
        deletedAt: null,
        course: {
          userId,
        },
      },
    });
  }

  create(data: CreateModuleDTO): Promise<Module> {
    return this.orm.module.create({
      data,
    });
  }

  update(moduleId: string, data: Partial<CreateModuleDTO>): Promise<Module> {
    return this.orm.module.update({
      where: { id: moduleId },
      data,
    });
  }

  async softDelete(moduleId: string): Promise<void> {
    await this.orm.module.updateMany({
      where: { id: moduleId, deletedAt: null },

      data: { deletedAt: new Date() },
    });
  }


async softDeleteAllByCourseIds(courseIds: string[]): Promise<void> {
    const modules = await this.orm.module.findMany({
        where: { courseId: { in: courseIds }, deletedAt: null },
    });

    const moduleIds = modules.map((m) => m.id);

    if (moduleIds.length > 0) {
        const disciplines = await this.orm.discipline.findMany({
            where: { moduleId: { in: moduleIds }, deletedAt: null }
        })
        const disciplineIds = disciplines.map(d => d.id)

        if (disciplineIds.length > 0) {
            await this.orm.goal.deleteMany({
                where: { disciplineId: { in: disciplineIds } }
            })

            await this.orm.studySession.deleteMany({
            where: { disciplineId: { in: disciplineIds } }
        })

        }

        await this.orm.goal.deleteMany({
            where: { moduleId: { in: moduleIds } }
        })


        await this.orm.studySession.deleteMany({
            where: { moduleId: { in: moduleIds } }
        })

        await this.orm.discipline.updateMany({
            where: { moduleId: { in: moduleIds }, deletedAt: null },
            data: { deletedAt: new Date() },
        });
    }

    await this.orm.module.updateMany({
        where: { courseId: { in: courseIds }, deletedAt: null },
        data: { deletedAt: new Date() },
    });
}
}
