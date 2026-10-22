// caminho completo do escopo na hierarquia curso > módulo > disciplina
export interface ScopePathDTO {
    courseId: string
    moduleId: string | null
    disciplineId: string | null
    ownerId: string
}
