import type { Discipline } from "@prisma/client"
import type { CreateDisciplineDTO } from "../../DTOs/create-discipline.DTO"
import type { DisciplineWithCourseDTO } from "../../DTOs/discipline-with-course-DTO"

export interface IDisciplineRepository {
    findById(disciplineId: string): Promise<Discipline | null>
    
    findAllByModuleId(moduleId: string): Promise<Discipline[]>
    
    findAllByModuleIdWithOwner(moduleId: string, userId: string): Promise<Discipline[]> 
    
    findByIdWithOwner(disciplineId: string, userId: string): Promise<Discipline | null>
    
    findAllByUserId(userId: string): Promise<Discipline[]> 

    findByIdWithCourse(disciplineId: string): Promise<DisciplineWithCourseDTO | null>
    
    create(data: CreateDisciplineDTO): Promise<Discipline>
    
    update(disciplineId: string, data: Partial<CreateDisciplineDTO>): Promise<Discipline>
    
    softDelete(disciplineId: string): Promise<void>
    
    softDeleteAllByModuleIds(moduleIds: string[]): Promise<void> 
}