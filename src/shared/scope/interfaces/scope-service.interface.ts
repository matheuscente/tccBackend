import type { ScopeFieldsDTO } from "../DTOs/scope-fields.DTO";
import type { ScopeInputDTO } from "../DTOs/scope-input.DTO";
import type { ScopePathDTO } from "../DTOs/scope-path.DTO";

export interface IScopeService {
    normalize(scope: ScopeInputDTO, required?: boolean): ScopeFieldsDTO

    resolveOwned(scope: ScopeInputDTO, ownerId: string): Promise<ScopePathDTO | null>

    // verifica se "inner" está contido em "outer" (ex.: uma disciplina está contida no seu módulo e no seu curso)
    isWithin(inner: ScopePathDTO, outer: ScopeFieldsDTO): boolean
}
