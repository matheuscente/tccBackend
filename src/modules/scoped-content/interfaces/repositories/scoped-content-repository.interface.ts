// remoção de um escopo: questões e atividades recebem soft delete; notas e arquivos apenas perdem o vínculo (o conteúdo do usuário é mantido)
export interface IScopedContentRepository {
    cleanupByCourseIds(courseIds: string[]): Promise<void>
    cleanupByModuleIds(moduleIds: string[]): Promise<void>
    cleanupByDisciplineIds(disciplineIds: string[]): Promise<void>
    cleanupByUserId(userId: string): Promise<void>
}
