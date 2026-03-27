import type { StudySession } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { ICourseRepository } from "../../courses/interfaces/repositories/course-repository.interface";
import type { IDisciplineRepository } from "../../disciplines/interfaces/repositories/discipline-repository.interface";
import type { IModuleRepository } from "../../modules/interfaces/repositories/module-repository.interface";
import type { StartStudySessionDTO } from "../DTOs/start-study-session.DTO";
import type { ResponseStudySessionDTO } from "../DTOs/response-study-session.DTO";
import type { UpdateStudySessionDTO } from "../DTOs/update-study-session.DTO";
import type { IStudySessionRepository } from "../interfaces/repositories/study-session-repository.interface";
import type { IStudySessionService } from "../interfaces/services/study-sessions-service.interface";
import { AuthorizationError } from "../../../shared/errors/authorization.error";
import type { IDateConvert } from "../../../shared/convert/interfaces/date-convert.interface";

export class StudySessionService implements IStudySessionService {
    constructor(
        private readonly studySessionRepository: IStudySessionRepository,
        private readonly ownership: IOwnershipService,
        private readonly courseRepository: ICourseRepository,
        private readonly disciplineRepository: IDisciplineRepository,
        private readonly moduleRepository: IModuleRepository,
        private readonly dateUtils: IDateConvert

    ) { }

async start(authUser: AuthUserDTO, data: StartStudySessionDTO): Promise<ResponseStudySessionDTO> {
    const scopes = [data.courseId, data.moduleId, data.disciplineId].filter(Boolean)
    if (scopes.length !== 1) throw new ValidationError("Sessão de estudo pode ter apenas um escopo")

    const ownerId = await this.ownership.resolveOwnerId(authUser, data.userId);

    if (data.courseId) {
        const parent = await this.courseRepository.findOwnedById(data.courseId, ownerId)
        if (!parent) throw new NotFoundError("Curso não encontrado")

    } else if (data.moduleId) {
        const parent = await this.moduleRepository.findByIdWithCourse(data.moduleId)
        if (!parent) throw new NotFoundError("Módulo não encontrado")
        if (parent.course.userId !== ownerId) throw new AuthorizationError("Ação não autorizada")

    } else if (data.disciplineId) {
        const parent = await this.disciplineRepository.findByIdWithCourse(data.disciplineId)
        if (!parent) throw new NotFoundError("Disciplina não encontrada")
        if (parent.module.course.userId !== ownerId) throw new AuthorizationError("Ação não autorizada")
    }

    const activeSession = await this.studySessionRepository.findActiveByUser(ownerId)

if (activeSession) {
    throw new ValidationError("Usuário já possui uma sessão em andamento")
}

    const studySession = await this.studySessionRepository.create({
        userId: ownerId,
        courseId: data.courseId ?? null,
        moduleId: data.moduleId ?? null,
        disciplineId: data.disciplineId ?? null,
        minutes: 0,
        startedAt: new Date(),
        status: "IN_PROGRESS",
        studiedAt: this.dateUtils.getCurrentDate()
    });

    return this.mapResponse(studySession);
}

async finish(authUser: AuthUserDTO, studySessionId: string): Promise<ResponseStudySessionDTO> {
    const studySession = await this.getAccessibleSession(authUser, studySessionId)

    if (!studySession) throw new NotFoundError("Sessão de estudo não encontrada")

    if (studySession.status !== "IN_PROGRESS") throw new ValidationError("Sessão de estudo já finalizada")

    const now = new Date()
    const minutes = Math.ceil((now.getTime() - studySession.startedAt.getTime()) / 60000)

    const updatedSession = await this.studySessionRepository.update(studySessionId, {
        minutes: minutes < 1 ? 1 : minutes,
        status: "COMPLETED"
    })

    return this.mapResponse(updatedSession)
}

    async findById(authUser: AuthUserDTO, studySessionId: string): Promise<ResponseStudySessionDTO | null> {
        const studySession = await this.getAccessibleSession(authUser, studySessionId)

        if (!studySession) return null;

        return this.mapResponse(studySession);
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string): Promise<ResponseStudySessionDTO[]> {
        // Se não for admin, só pode buscar o próprio usuário
        this.ownership.validateOwnership(authUser, targetUserId);

        const studySessions = await this.studySessionRepository.findAllByUserId(targetUserId);

        return studySessions.map((studySession) => this.mapResponse(studySession));
    }

    async update(authUser: AuthUserDTO, studySessionId: string, data: UpdateStudySessionDTO): Promise<ResponseStudySessionDTO> {

        const studySession = await this.getAccessibleSession(authUser, studySessionId)

        if (!studySession) throw new NotFoundError("Sessão de estudo não encontrada");

        if (studySession.status !== "COMPLETED") {
    throw new ValidationError("Só é possível editar sessões finalizadas")
}

        let studiedAt: Date | undefined;
        if (data.studiedAt) {
            studiedAt = this.dateUtils.dateFormat(data.studiedAt)
            if (!this.isValidDate(studiedAt)) throw new ValidationError("Data estudada inválida")
        }

        const updatedStudySession = await this.studySessionRepository.update(studySessionId, {
            studiedAt: studiedAt ?? studySession.studiedAt
        });

        return this.mapResponse(updatedStudySession);
    }

    async delete(authUser: AuthUserDTO, studySessionId: string): Promise<void> {
        const studySession = await this.getAccessibleSession(authUser, studySessionId)

        //método Idempotente. Se studySession já não existe, retorna null
        if (!studySession) return;

        await this.studySessionRepository.delete(studySessionId);
    }

    private isValidDate(date: Date): boolean {
        return date.getTime() <= this.dateUtils.getCurrentDate().getTime();
    }

    private async getAccessibleSession(authUser: AuthUserDTO, id: string) {
        return authUser.role === "ADMIN"
            ? this.studySessionRepository.findById(id)
            : this.studySessionRepository.findByIdWithOwner(id, authUser.id)
    }


private mapResponse(studySession: StudySession): ResponseStudySessionDTO {
    return {
        id: studySession.id,
        minutes: studySession.minutes,
        status: studySession.status,
        startedAt: studySession.startedAt,
        courseId: studySession.courseId,
        moduleId: studySession.moduleId,
        disciplineId: studySession.disciplineId,
        studiedAt: studySession.studiedAt,
        createdAt: studySession.createdAt
    };
}
}