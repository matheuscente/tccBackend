/**
 * Escopo de um conteúdo do usuário: curso, módulo ou disciplina.
 * Questões, atividades, notas e arquivos podem estar ligados a um único escopo.
 */
export interface ScopeInputDTO {
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
}

/**
 * Caminho completo de um escopo na hierarquia curso > módulo > disciplina.
 */
export interface ScopePathDTO {
    courseId: string
    moduleId: string | null
    disciplineId: string | null
    ownerId: string
}

export interface ScopeFieldsDTO {
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}
