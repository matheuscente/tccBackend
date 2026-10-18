import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/scope-service.interface";
import type { CreateQuestionDTO, QuestionOptionInputDTO, UpdateQuestionDTO } from "../DTOs/create-question.DTO";
import type { QuestionScopeFilterDTO, QuestionWithOptionsDTO } from "../DTOs/question-with-options.DTO";
import type { ResponseQuestionDTO } from "../DTOs/response-question.DTO";
import type { IQuestionRepository } from "../interfaces/repositories/question-repository.interface";
import type { IQuestionService } from "../interfaces/services/question-service.interface";
import type { QuestionType } from "@prisma/client";

export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 6

export class QuestionService implements IQuestionService {
    constructor(
        private readonly questionRepository: IQuestionRepository,
        private readonly ownership: IOwnershipService,
        private readonly scopeService: IScopeService
    ) { }

    async create(authUser: AuthUserDTO, data: CreateQuestionDTO): Promise<ResponseQuestionDTO> {
        const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId)

        const scope = this.scopeService.normalize(data, true)
        await this.scopeService.resolveOwned(scope, ownerId)

        const options = this.prepareOptions(data.type, data.options)

        const question = await this.questionRepository.create({
            userId: ownerId,
            statement: data.statement.trim(),
            type: data.type,
            explanation: data.explanation?.trim() || null,
            ...scope,
            options
        })

        return QuestionService.mapResponse(question)
    }

    async findById(authUser: AuthUserDTO, questionId: string): Promise<ResponseQuestionDTO | null> {
        const question = await this.questionRepository.findById(questionId)
        if (!question) return null

        this.ownership.validateOwnership(authUser, question.userId)

        return QuestionService.mapResponse(question)
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: QuestionScopeFilterDTO): Promise<ResponseQuestionDTO[]> {
        this.ownership.validateOwnership(authUser, targetUserId)

        const questions = await this.questionRepository.findAllByUserId(targetUserId, filter)

        return questions.map(question => QuestionService.mapResponse(question))
    }

    async update(authUser: AuthUserDTO, questionId: string, data: UpdateQuestionDTO): Promise<ResponseQuestionDTO> {
        const question = await this.questionRepository.findById(questionId)
        if (!question) throw new NotFoundError("Questão não encontrada")

        this.ownership.validateOwnership(authUser, question.userId)

        const updated = await this.questionRepository.update(questionId, {
            ...(data.statement !== undefined ? { statement: data.statement.trim() } : {}),
            ...(data.explanation !== undefined ? { explanation: data.explanation?.trim() || null } : {}),
            ...(data.options ? { options: this.prepareOptions(question.type, data.options) } : {})
        })

        return QuestionService.mapResponse(updated)
    }

    async softDelete(authUser: AuthUserDTO, questionId: string): Promise<void> {
        const question = await this.questionRepository.findById(questionId)

        // idempotente
        if (!question) return

        this.ownership.validateOwnership(authUser, question.userId)

        await this.questionRepository.softDelete(questionId)
    }

    /**
     * Regras das alternativas:
     * - verdadeiro/falso: exatamente 2 alternativas
     * - múltipla escolha: de 2 a 6 alternativas
     * - sempre exatamente uma alternativa correta e sem textos repetidos
     */
    private prepareOptions(type: QuestionType, options: QuestionOptionInputDTO[]) {
        if (!options || options.length < MIN_OPTIONS) throw new ValidationError(`Informe pelo menos ${MIN_OPTIONS} alternativas`)

        if (type === "TRUE_FALSE" && options.length !== 2) throw new ValidationError("Questões de verdadeiro ou falso devem ter exatamente 2 alternativas")

        if (options.length > MAX_OPTIONS) throw new ValidationError(`Informe no máximo ${MAX_OPTIONS} alternativas`)

        const correct = options.filter(option => option.isCorrect).length
        if (correct !== 1) throw new ValidationError("Marque exatamente uma alternativa correta")

        const texts = options.map(option => option.text.trim().toLowerCase())
        if (new Set(texts).size !== texts.length) throw new ValidationError("As alternativas não podem se repetir")

        return options.map((option, index) => ({
            text: option.text.trim(),
            isCorrect: option.isCorrect,
            order: index
        }))
    }

    static mapResponse(question: QuestionWithOptionsDTO, hideAnswers = false): ResponseQuestionDTO {
        return {
            id: question.id,
            statement: question.statement,
            type: question.type,
            explanation: hideAnswers ? null : question.explanation,
            courseId: question.courseId,
            moduleId: question.moduleId,
            disciplineId: question.disciplineId,
            options: question.options.map(option => ({
                id: option.id,
                text: option.text,
                order: option.order,
                ...(hideAnswers ? {} : { isCorrect: option.isCorrect })
            })),
            createdAt: question.createdAt.toISOString(),
            updatedAt: question.updatedAt.toISOString()
        }
    }
}
