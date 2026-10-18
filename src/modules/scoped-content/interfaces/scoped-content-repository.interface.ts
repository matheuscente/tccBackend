/**
 * Limpa os conteúdos ligados a um escopo (curso, módulo ou disciplina) quando ele é removido.
 * - questões e atividades: soft delete
 * - notas e arquivos: perdem o vínculo com o escopo (o conteúdo do usuário é mantido)
 */
export interface IScopedContentRepository {
    cleanupByCourseIds(courseIds: string[]): Promise<void>
    cleanupByModuleIds(moduleIds: string[]): Promise<void>
    cleanupByDisciplineIds(disciplineIds: string[]): Promise<void>
    cleanupByUserId(userId: string): Promise<void>
}
