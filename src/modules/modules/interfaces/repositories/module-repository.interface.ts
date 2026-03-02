import type { Module, Prisma } from "@prisma/client"
import type { CreateModuleDTO } from "../../DTOs/create-module.dto"

export interface IModuleRepository {
findById(moduleId: string): Promise<Module | null>

findAllByCourseId(courseId: string): Promise<Module[]>

findAllByCourseIdWithOwner(courseId: string, userId: string): Promise<Module[]> 

findByIdWithOwner(moduleId: string, userId: string): Promise<Module | null>

findAllByUserId(userId: string): Promise<Module[]> 

create(data: CreateModuleDTO): Promise<Module>

update(moduleId: string, data: Partial<CreateModuleDTO>): Promise<Module>

softDelete(moduleId: string): Promise<void>

softDeleteAllByCourseIds(courseIds: string[]): Promise<void> 
}