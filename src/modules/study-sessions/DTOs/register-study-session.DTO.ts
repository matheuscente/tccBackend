import type { StartStudySessionDTO } from "./start-study-session.DTO";

export interface RegisterStudySessionDTO extends StartStudySessionDTO {
  minutes: number,
  studiedAt: string
}
