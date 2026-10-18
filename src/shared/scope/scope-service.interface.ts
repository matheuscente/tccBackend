import type { ScopeFieldsDTO, ScopeInputDTO, ScopePathDTO } from "./scope.DTO";

export interface IScopeService {
    /**
     * Garante que no máximo um escopo foi informado (ou exatamente um quando required = true).
     * Retorna os campos normalizados com null nos escopos não usados.
     */
    normalize(scope: ScopeInputDTO, required?: boolean): ScopeFieldsDTO

    /**
     * Resolve o caminho completo do escopo e valida que pertence ao ownerId.
     * Retorna null quando nenhum escopo foi informado.
     */
    resolveOwned(scope: ScopeInputDTO, ownerId: string): Promise<ScopePathDTO | null>

    /**
     * Verifica se o escopo "inner" está contido no escopo "outer".
     * Ex.: uma disciplina está contida no seu módulo e no seu curso.
     */
    isWithin(inner: ScopePathDTO, outer: ScopeFieldsDTO): boolean
}
