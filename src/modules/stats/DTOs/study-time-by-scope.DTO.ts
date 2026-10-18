export interface StudyTimeByScopeDTO {
  scopeId: string,
  scope: "discipline" | "module" | "course"
  title: string
  minutes: number
}
