
export interface StartStudySessionDTO {
  userId?: string,
  courseId?: string | null,
  moduleId?: string | null,
  disciplineId?: string | null,
}

export interface RegisterStudySessionDTO extends StartStudySessionDTO {
  minutes: number,
  studiedAt: string
}
