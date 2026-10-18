import { randomUUID } from "crypto";
import path from "path";
import type { StoredFile } from "@prisma/client";
import type { AuthUserDTO } from "../../../shared/DTOs/auth-user.DTO";
import { NotFoundError } from "../../../shared/errors/not-found-error";
import { ValidationError } from "../../../shared/errors/validation-error";
import type { IOwnershipService } from "../../../shared/ownership/ownership-service.interface";
import type { IScopeService } from "../../../shared/scope/scope-service.interface";
import type { IStorageProvider } from "../../../shared/storage/storage-provider.interface";
import type { IFileTokenService } from "../../../shared/file-token/file-token.service";
import type { FileAccessDTO, FileFilterDTO, FileScopeDTO, ResponseFileDTO, UpdateFileDTO, UploadedFileDTO } from "../DTOs/file.DTO";
import type { IFileRepository } from "../interfaces/repositories/file-repository.interface";
import type { IFileService } from "../interfaces/services/file-service.interface";

export const USER_STORAGE_QUOTA_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB por usuário

/**
 * Arquivos pessoais: somente o dono acessa. Por privacidade, nem o administrador
 * consegue listar, baixar ou visualizar os arquivos de outro usuário.
 */
export class FileService implements IFileService {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storage: IStorageProvider,
        private readonly ownership: IOwnershipService,
        private readonly scopeService: IScopeService,
        private readonly fileTokenService: IFileTokenService,
        private readonly publicApiUrl: string
    ) { }

    async upload(authUser: AuthUserDTO, file: UploadedFileDTO | undefined, scopeInput: FileScopeDTO): Promise<ResponseFileDTO> {
        if (!file) throw new ValidationError("Selecione um arquivo para enviar")
        if (file.size === 0) throw new ValidationError("O arquivo está vazio")

        const scope = this.scopeService.normalize(scopeInput)
        await this.scopeService.resolveOwned(scope, authUser.id)

        const used = await this.fileRepository.sumSizeByUserId(authUser.id)
        if (used + file.size > USER_STORAGE_QUOTA_BYTES) throw new ValidationError("Limite de armazenamento (2 GB) atingido")

        const originalName = this.sanitizeName(file.originalname)
        const extension = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "")
        const storageKey = `users/${authUser.id}/${randomUUID()}${extension}`
        const mimeType = file.mimetype || "application/octet-stream"

        await this.storage.put(storageKey, file.buffer, mimeType)

        try {
            const stored = await this.fileRepository.create({
                userId: authUser.id,
                originalName,
                mimeType,
                size: file.size,
                storageKey,
                ...scope
            })

            return this.mapResponse(stored)
        } catch (err) {
            await this.storage.delete(storageKey).catch(() => undefined)
            throw err
        }
    }

    async findById(authUser: AuthUserDTO, fileId: string): Promise<ResponseFileDTO> {
        const file = await this.getOwned(authUser, fileId)
        return this.mapResponse(file)
    }

    async findAllByUserId(authUser: AuthUserDTO, targetUserId: string, filter: FileFilterDTO): Promise<ResponseFileDTO[]> {
        this.ownership.validateStrictOwnership(authUser, targetUserId)

        const files = await this.fileRepository.findAllByUserId(targetUserId, filter)
        return files.map(file => this.mapResponse(file))
    }

    async update(authUser: AuthUserDTO, fileId: string, data: UpdateFileDTO): Promise<ResponseFileDTO> {
        const file = await this.getOwned(authUser, fileId)

        const scopeChanged = data.courseId !== undefined || data.moduleId !== undefined || data.disciplineId !== undefined
        const scope = scopeChanged ? this.scopeService.normalize(data) : null
        if (scope) await this.scopeService.resolveOwned(scope, authUser.id)

        const updated = await this.fileRepository.update(file.id, {
            ...(data.originalName ? { originalName: this.sanitizeName(data.originalName) } : {}),
            ...(scope ?? {})
        })

        return this.mapResponse(updated)
    }

    async delete(authUser: AuthUserDTO, fileId: string): Promise<void> {
        const file = await this.fileRepository.findById(fileId)
        if (!file) return

        this.ownership.validateStrictOwnership(authUser, file.userId)

        await this.fileRepository.delete(file.id)
        await this.storage.delete(file.storageKey).catch(() => undefined)
    }

    async createAccess(authUser: AuthUserDTO, fileId: string): Promise<FileAccessDTO> {
        const file = await this.getOwned(authUser, fileId)

        const token = this.fileTokenService.sign({ sub: file.id, kind: "file" })
        const base = `${this.publicApiUrl}/files/${file.id}/content?token=${encodeURIComponent(token)}`

        return {
            viewUrl: base,
            downloadUrl: `${base}&download=1`,
            expiresInSeconds: 60 * 30
        }
    }

    async resolveByToken(token: string): Promise<StoredFile> {
        const payload = this.fileTokenService.verify(token, "file")

        const file = await this.fileRepository.findById(payload.sub)
        if (!file) throw new NotFoundError("Arquivo não encontrado")

        return file
    }

    private async getOwned(authUser: AuthUserDTO, fileId: string): Promise<StoredFile> {
        const file = await this.fileRepository.findById(fileId)
        if (!file) throw new NotFoundError("Arquivo não encontrado")

        this.ownership.validateStrictOwnership(authUser, file.userId)

        return file
    }

    private sanitizeName(name: string): string {
        const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim()
        return (clean || "arquivo").slice(0, 200)
    }

    private mapResponse(file: StoredFile): ResponseFileDTO {
        return {
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            courseId: file.courseId,
            moduleId: file.moduleId,
            disciplineId: file.disciplineId,
            createdAt: file.createdAt.toISOString()
        }
    }
}
