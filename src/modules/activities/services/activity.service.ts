import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/interfaces/scope-service.interface";
import type { ScopeFieldsDTO } from "../../../shared/scope/DTOs/scope-fields.DTO";
import type { IQuestionRepository } from "../../questions/interfaces/repositories/question-repository.interface";
import type { ResponseQuestionDTO } from "../../questions/DTOs/response-question.DTO";
import { QuestionService } from "../../questions/services/question.service";
import type { ITransaction } from "../../transaction/interfaces/transaction.interface";
import type { ActivityWithStatsDTO } from "../DTOs/activity-with-stats.DTO";
import type { AttemptWithActivityDTO } from "../DTOs/attempt-with-activity.DTO";
import type { AttemptWithAnswersDTO } from "../DTOs/attempt-with-answers.DTO";
import type { CreateActivityDTO } from "../DTOs/create-activity.DTO";
import type { UpdateActivityDTO } from "../DTOs/update-activity.DTO";
import type { SubmitAttemptDTO } from "../DTOs/submit-attempt.DTO";
import type { ResponseActivityDTO } from "../DTOs/response-activity.DTO";
import type { ResponseActivityDetailDTO } from "../DTOs/response-activity-detail.DTO";
import type { ResponseActivityForAnsweringDTO } from "../DTOs/response-activity-for-answering.DTO";
import type { ResponseAttemptDTO } from "../DTOs/response-attempt.DTO";
import type { IActivityRepository } from "../interfaces/repositories/activity-repository.interface";
import type { IActivityService } from "../interfaces/services/activity-service.interface";
import type { Activity } from "@prisma/client";

export const MAX_QUESTIONS_PER_ACTIVITY = 100

export class ActivityService implements IActivityService {
    constructor(
        private readonly activityRepository: IActivityRepository,
        private readonly questionRepository: IQuestionRepository,
        private readonly ownership: IOwnershipService,
        private readonly scopeService: IScopeService,
        private readonly transaction: ITransaction
    ) { }

    async create(authUser: AuthUserDTO, data: CreateActivityDTO): Promise<ResponseActivityDetailDTO> {
        const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId)

        const scope = this.scopeService.normalize(data, true)
        await this.scopeService.resolveOwned(scope, ownerId)

        const questionIds = data.questionIds ?? []
        await this.validateQuestions(questionIds, ownerId, scope)

        const activity = await this.transaction.execute(async (repositories) => {
            const created = await repositories.activityRepository.create({
                userId: ownerId,
                title: data.title.trim(),
                description: data.description?.trim() || null,
                ...scope
            })

            await repositories.activityRepository.setQuestions(created.id, questionIds)

            return created
        })

        return this.getDetail(activity.id)
    }

    async findById(authUser: AuthUserDTO, activityId: string): Promise<ResponseActivityDetailDTO | null> {
        const activity = await this.activityRepository.findById(activityId)
        if (!activity) return null

        this.ownership.validateOwnership(authUser, activity.userId)

        return this.getDetail(activityId)
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseActivityDTO[]> {
        this.ownership.validateOwnership(authUser, targetUserId)

        const activities = await this.activityRepository.findAllByUserId(targetUserId)

        return activities.map(activity => this.mapResponse(activity))
    }

    async update(authUser: AuthUserDTO, activityId: string, data: UpdateActivityDTO): Promise<ResponseActivityDetailDTO> {
        const activity = await this.getOwned(authUser, activityId)

        await this.activityRepository.update(activity.id, {
            ...(data.title !== undefined ? { title: data.title.trim() } : {}),
            ...(data.description !== undefined ? { description: data.description?.trim() || null } : {})
        })

        return this.getDetail(activity.id)
    }

    async setQuestions(authUser: AuthUserDTO, activityId: string, questionIds: string[]): Promise<ResponseActivityDetailDTO> {
        const activity = await this.getOwned(authUser, activityId)

        await this.validateQuestions(questionIds, activity.userId, activity)

        await this.transaction.execute((repositories) => repositories.activityRepository.setQuestions(activity.id, questionIds))

        return this.getDetail(activity.id)
    }

    async softDelete(authUser: AuthUserDTO, activityId: string): Promise<void> {
        const activity = await this.activityRepository.findById(activityId)

        if (!activity) return

        this.ownership.validateOwnership(authUser, activity.userId)

        await this.activityRepository.softDelete(activityId)
    }

    async getForAnswering(authUser: AuthUserDTO, activityId: string): Promise<ResponseActivityForAnsweringDTO> {
        const activity = await this.activityRepository.findByIdWithQuestions(activityId)
        if (!activity) throw new NotFoundError("Atividade não encontrada")

        // apenas o dono responde às próprias atividades, nem o administrador
        this.ownership.validateStrictOwnership(authUser, activity.userId)

        if (activity.questions.length === 0) throw new ValidationError("A atividade não possui questões")

        return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            questions: activity.questions.map(item => QuestionService.mapResponse(item.question, true))
        }
    }

    async submitAttempt(authUser: AuthUserDTO, activityId: string, data: SubmitAttemptDTO): Promise<ResponseAttemptDTO> {
        const activity = await this.activityRepository.findByIdWithQuestions(activityId)
        if (!activity) throw new NotFoundError("Atividade não encontrada")

        this.ownership.validateStrictOwnership(authUser, activity.userId)

        if (activity.questions.length === 0) throw new ValidationError("A atividade não possui questões")

        const answersByQuestion = new Map(data.answers.map(answer => [answer.questionId, answer.optionId]))

        const unknown = data.answers.find(answer => !activity.questions.some(item => item.question.id === answer.questionId))
        if (unknown) throw new ValidationError("Resposta enviada para uma questão que não pertence à atividade")

        const answers = activity.questions.map(({ question }) => {
            const selectedOptionId = answersByQuestion.get(question.id) ?? null

            if (selectedOptionId && !question.options.some(option => option.id === selectedOptionId)) {
                throw new ValidationError("Alternativa inválida para a questão")
            }

            const correct = question.options.find(option => option.isCorrect)

            return {
                questionId: question.id,
                selectedOptionId,
                isCorrect: !!selectedOptionId && correct?.id === selectedOptionId
            }
        })

        const correctCount = answers.filter(answer => answer.isCorrect).length
        const totalQuestions = answers.length
        const score = Math.round((correctCount / totalQuestions) * 10000) / 100

        const startedAt = data.startedAt ? new Date(data.startedAt) : new Date()
        const safeStartedAt = Number.isNaN(startedAt.getTime()) || startedAt.getTime() > Date.now() ? new Date() : startedAt

        const attempt = await this.activityRepository.createAttempt({
            activityId: activity.id,
            userId: activity.userId,
            correctCount,
            totalQuestions,
            score,
            startedAt: safeStartedAt,
            answers
        })

        const detail = await this.activityRepository.findAttemptById(attempt.id)
        if (!detail) throw new NotFoundError("Tentativa não encontrada")

        return this.mapAttempt(detail)
    }

    async findAttempts(authUser: AuthUserDTO, activityId: string): Promise<ResponseAttemptDTO[]> {
        const activity = await this.activityRepository.findById(activityId)
        if (!activity) throw new NotFoundError("Atividade não encontrada")

        this.ownership.validateOwnership(authUser, activity.userId)

        const attempts = await this.activityRepository.findAttemptsByActivityId(activityId)

        return attempts.map(attempt => this.mapAttempt(attempt))
    }

    async findAttemptById(authUser: AuthUserDTO, attemptId: string): Promise<ResponseAttemptDTO | null> {
        const attempt = await this.activityRepository.findAttemptById(attemptId)
        if (!attempt) return null

        this.ownership.validateOwnership(authUser, attempt.userId)

        return this.mapAttempt(attempt)
    }

    private async getOwned(authUser: AuthUserDTO, activityId: string): Promise<Activity> {
        const activity = await this.activityRepository.findById(activityId)
        if (!activity) throw new NotFoundError("Atividade não encontrada")

        this.ownership.validateOwnership(authUser, activity.userId)

        return activity
    }

    // as questões precisam ser do mesmo dono e estar dentro do escopo da atividade (um curso aceita questões dos seus módulos e disciplinas)
    private async validateQuestions(questionIds: string[], ownerId: string, scope: ScopeFieldsDTO): Promise<void> {
        if (questionIds.length === 0) return

        if (new Set(questionIds).size !== questionIds.length) throw new ValidationError("Há questões repetidas na atividade")

        if (questionIds.length > MAX_QUESTIONS_PER_ACTIVITY) {
            throw new ValidationError(`Uma atividade pode ter no máximo ${MAX_QUESTIONS_PER_ACTIVITY} questões`)
        }

        const questions = await this.questionRepository.findManyByIds(questionIds, ownerId)
        if (questions.length !== questionIds.length) throw new NotFoundError("Uma ou mais questões não foram encontradas")

        for (const question of questions) {
            const path = await this.scopeService.resolveOwned(question, ownerId)

            if (!path || !this.scopeService.isWithin(path, scope)) {
                throw new ValidationError(`A questão "${question.statement.slice(0, 40)}" não pertence ao escopo da atividade`)
            }
        }
    }

    private async getDetail(activityId: string): Promise<ResponseActivityDetailDTO> {
        const [withStats, withQuestions] = await Promise.all([
            this.activityRepository.findByIdWithStats(activityId),
            this.activityRepository.findByIdWithQuestions(activityId)
        ])

        if (!withStats || !withQuestions) throw new NotFoundError("Atividade não encontrada")

        const questions: ResponseQuestionDTO[] = withQuestions.questions.map(item => QuestionService.mapResponse(item.question))

        return {
            ...this.mapResponse(withStats),
            questionCount: questions.length,
            questions
        }
    }

    private mapResponse(activity: ActivityWithStatsDTO): ResponseActivityDTO {
        const scores = activity.attempts.map(attempt => attempt.score)
        const last = activity.attempts[0]

        return {
            id: activity.id,
            title: activity.title,
            description: activity.description,
            courseId: activity.courseId,
            moduleId: activity.moduleId,
            disciplineId: activity.disciplineId,
            questionCount: activity._count.questions,
            attemptCount: activity._count.attempts,
            bestScore: scores.length ? Math.max(...scores) : null,
            lastScore: last ? last.score : null,
            lastAttemptAt: last ? last.finishedAt.toISOString() : null,
            createdAt: activity.createdAt.toISOString(),
            updatedAt: activity.updatedAt.toISOString()
        }
    }

    private mapAttempt(attempt: AttemptWithActivityDTO | AttemptWithAnswersDTO): ResponseAttemptDTO {
        const base: ResponseAttemptDTO = {
            id: attempt.id,
            activityId: attempt.activityId,
            activityTitle: attempt.activity.title,
            correctCount: attempt.correctCount,
            totalQuestions: attempt.totalQuestions,
            score: attempt.score,
            startedAt: attempt.startedAt.toISOString(),
            finishedAt: attempt.finishedAt.toISOString(),
            durationSeconds: Math.max(0, Math.round((attempt.finishedAt.getTime() - attempt.startedAt.getTime()) / 1000))
        }

        if (!("answers" in attempt)) return base

        return {
            ...base,
            answers: attempt.answers.map(answer => ({
                questionId: answer.questionId,
                statement: answer.question.statement,
                explanation: answer.question.explanation,
                selectedOptionId: answer.selectedOptionId,
                correctOptionId: answer.question.options.find(option => option.isCorrect)?.id ?? null,
                isCorrect: answer.isCorrect,
                options: answer.question.options.map(option => ({ id: option.id, text: option.text }))
            }))
        }
    }
}

