import type { Activity, ActivityAttempt, AttemptAnswer, Question, QuestionOption } from "@prisma/client"
import type { ResponseQuestionDTO } from "../../questions/DTOs/response-question.DTO"

export interface CreateActivityDTO {
    title: string
    description?: string | null
    userId?: string
    courseId?: string | null
    moduleId?: string | null
    disciplineId?: string | null
    questionIds?: string[]
}

export interface UpdateActivityDTO {
    title?: string
    description?: string | null
}

export interface CreateActivityRepositoryDTO {
    userId: string
    title: string
    description: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
}

export interface ActivityWithQuestionsDTO extends Activity {
    questions: {
        order: number
        question: Question & { options: QuestionOption[] }
    }[]
}

export interface ActivityWithStatsDTO extends Activity {
    _count: { questions: number, attempts: number }
    attempts: { score: number, finishedAt: Date }[]
}

export interface ResponseActivityDTO {
    id: string
    title: string
    description: string | null
    courseId: string | null
    moduleId: string | null
    disciplineId: string | null
    questionCount: number
    attemptCount: number
    bestScore: number | null
    lastScore: number | null
    lastAttemptAt: string | null
    createdAt: string
    updatedAt: string
}

export interface ResponseActivityDetailDTO extends ResponseActivityDTO {
    questions: ResponseQuestionDTO[]
}

export interface SubmitAttemptDTO {
    startedAt?: string
    answers: { questionId: string, optionId: string | null }[]
}

export interface CreateAttemptRepositoryDTO {
    activityId: string
    userId: string
    correctCount: number
    totalQuestions: number
    score: number
    startedAt: Date
    answers: { questionId: string, selectedOptionId: string | null, isCorrect: boolean }[]
}

export interface AttemptWithAnswersDTO extends ActivityAttempt {
    activity: { id: string, title: string }
    answers: (AttemptAnswer & {
        question: Question & { options: QuestionOption[] }
    })[]
}

export interface ResponseAttemptDTO {
    id: string
    activityId: string
    activityTitle: string
    correctCount: number
    totalQuestions: number
    score: number
    startedAt: string
    finishedAt: string
    durationSeconds: number
    answers?: {
        questionId: string
        statement: string
        explanation: string | null
        selectedOptionId: string | null
        correctOptionId: string | null
        isCorrect: boolean
        options: { id: string, text: string }[]
    }[]
}
