export interface StudyTimeByScopeDTO {
  scopeId: string,
  scope: "discipline" | "module" | "course"
  minutes: number
}