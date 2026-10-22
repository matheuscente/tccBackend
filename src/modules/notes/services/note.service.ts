import type { Note } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/interfaces/scope-service.interface";
import type { CreateNoteDTO } from "../DTOs/create-note.DTO";
import type { UpdateNoteDTO } from "../DTOs/update-note.DTO";
import type { NoteFilterDTO } from "../DTOs/note-filter.DTO";
import type { ResponseNoteDTO } from "../DTOs/response-note.DTO";
import type { INoteRepository } from "../interfaces/repositories/note-repository.interface";
import type { INoteService } from "../interfaces/services/note-service.interface";

export class NoteService implements INoteService {
    constructor(
        private readonly noteRepository: INoteRepository,
        private readonly ownership: IOwnershipService,
        private readonly scopeService: IScopeService
    ) { }

    async create(authUser: AuthUserDTO, data: CreateNoteDTO): Promise<ResponseNoteDTO> {
        // notas são privadas: somente o próprio usuário cria e acessa, nem o administrador
        const ownerId = authUser.id

        const scope = this.scopeService.normalize(data)
        await this.scopeService.resolveOwned(scope, ownerId)

        const note = await this.noteRepository.create({
            userId: ownerId,
            title: data.title.trim(),
            content: data.content ?? "",
            ...scope
        })

        return this.mapResponse(note)
    }

    async findById(authUser: AuthUserDTO, noteId: string): Promise<ResponseNoteDTO | null> {
        const note = await this.noteRepository.findById(noteId)
        if (!note) return null

        this.ownership.validateStrictOwnership(authUser, note.userId)

        return this.mapResponse(note)
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: NoteFilterDTO): Promise<ResponseNoteDTO[]> {
        this.ownership.validateStrictOwnership(authUser, targetUserId)

        const notes = await this.noteRepository.findAllByUserId(targetUserId, filter)

        return notes.map(note => this.mapResponse(note))
    }

    async update(authUser: AuthUserDTO, noteId: string, data: UpdateNoteDTO): Promise<ResponseNoteDTO> {
        const note = await this.noteRepository.findById(noteId)
        if (!note) throw new NotFoundError("Nota não encontrada")

        this.ownership.validateStrictOwnership(authUser, note.userId)

        const scopeChanged = data.courseId !== undefined || data.moduleId !== undefined || data.disciplineId !== undefined
        const scope = scopeChanged ? this.scopeService.normalize(data) : null
        if (scope) await this.scopeService.resolveOwned(scope, note.userId)

        const updated = await this.noteRepository.update(noteId, {
            ...(data.title !== undefined ? { title: data.title.trim() } : {}),
            ...(data.content !== undefined ? { content: data.content } : {}),
            ...(scope ?? {})
        })

        return this.mapResponse(updated)
    }

    async softDelete(authUser: AuthUserDTO, noteId: string): Promise<void> {
        const note = await this.noteRepository.findById(noteId)
        if (!note) return

        this.ownership.validateStrictOwnership(authUser, note.userId)

        await this.noteRepository.softDelete(noteId)
    }

    private mapResponse(note: Note): ResponseNoteDTO {
        return {
            id: note.id,
            title: note.title,
            content: note.content,
            courseId: note.courseId,
            moduleId: note.moduleId,
            disciplineId: note.disciplineId,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString()
        }
    }
}
