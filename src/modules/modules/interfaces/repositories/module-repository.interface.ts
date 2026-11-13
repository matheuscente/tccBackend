import type { Module } from "@prisma/client"
import type { CreateModuleDTO } from "../../DTOs/create-module.dto"
import type { ModuleWithCourseDTO } from "../../DTOs/module-with-course.DTO"

export interface IModuleRepository {
findById(moduleId: string): Promise<Module | null>

findAllByCourseId(courseId: string): Promise<Module[]>

findAllByCourseIdWithOwner(courseId: string, userId: string): Promise<Module[]> 

findByIdWithOwner(moduleId: string, userId: string): Promise<Module | null>

findAllByUserId(userId: string): Promise<Module[]> 

 findByIdWithCourse(moduleId: string): Promise<ModuleWithCourseDTO | null>

create(data: CreateModuleDTO): Promise<Module>

update(moduleId: string, data: Partial<CreateModuleDTO>): Promise<Module>

softDelete(moduleId: string): Promise<void>

softDeleteAllByCourseIds(courseIds: string[]): Promise<void> 
}