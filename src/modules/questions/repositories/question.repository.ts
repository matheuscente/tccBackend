import type { Prisma, PrismaClient } from "@prisma/client";
import type { IQuestionRepository } from "../interfaces/repositories/question-repository.interface";
import type { CreateQuestionRepositoryDTO, UpdateQuestionRepositoryDTO } from "../DTOs/create-question-repository.DTO";
import type { QuestionScopeFilterDTO, QuestionWithOptionsDTO } from "../DTOs/question-with-options.DTO";

const includeOptions = { options: { orderBy: { order: "asc" } } } as const

export class QuestionRepository implements IQuestionRepository {
    constructor(private readonly orm: PrismaClient | Prisma.TransactionClient) { }

    create(data: CreateQuestionRepositoryDTO): Promise<QuestionWithOptionsDTO> {
        const { options, ...question } = data

        return this.orm.question.create({
            data: {
                ...question,
                options: { create: options }
            },
            include: includeOptions
        })
    }

    findById(questionId: string): Promise<QuestionWithOptionsDTO | null> {
        return this.orm.question.findFirst({
            where: { id: questionId, deletedAt: null },
            include: includeOptions
        })
    }

    findAllByUserId(userId: string, filter: QuestionScopeFilterDTO = {}): Promise<QuestionWithOptionsDTO[]> {
        return this.orm.question.findMany({
            where: {
                userId,
                deletedAt: null,
                ...this.scopeWhere(filter),
                ...(filter.search ? { statement: { contains: filter.search, mode: "insensitive" } } : {})
            },
            include: includeOptions,
            orderBy: { createdAt: "desc" }
        })
    }

    findManyByIds(questionIds: string[], userId: string): Promise<QuestionWithOptionsDTO[]> {
        return this.orm.question.findMany({
            where: { id: { in: questionIds }, userId, deletedAt: null },
            include: includeOptions
        })
    }

    async update(questionId: string, data: UpdateQuestionRepositoryDTO): Promise<QuestionWithOptionsDTO> {
        const { options, ...fields } = data

        if (options) {
            // as alternativas são recriadas: respostas antigas ficam com selectedOptionId = null
            await this.orm.questionOption.deleteMany({ where: { questionId } })
        }

        return this.orm.question.update({
            where: { id: questionId },
            data: {
                ...fields,
                ...(options ? { options: { create: options } } : {})
            },
            include: includeOptions
        })
    }

    async softDelete(questionId: string): Promise<void> {
        await this.orm.question.updateMany({
            where: { id: questionId, deletedAt: null },
            data: { deletedAt: new Date() }
        })
    }

    /**
     * Filtro hierárquico: um curso inclui as questões dos seus módulos e disciplinas.
     */
    private scopeWhere(filter: QuestionScopeFilterDTO): Prisma.QuestionWhereInput {
        if (filter.disciplineId) return { disciplineId: filter.disciplineId }

        if (filter.moduleId) return {
            OR: [
                { moduleId: filter.moduleId },
                { discipline: { moduleId: filter.moduleId } }
            ]
        }

        if (filter.courseId) return {
            OR: [
                { courseId: filter.courseId },
                { module: { courseId: filter.courseId } },
                { discipline: { module: { courseId: filter.courseId } } }
            ]
        }

        return {}
    }
}
