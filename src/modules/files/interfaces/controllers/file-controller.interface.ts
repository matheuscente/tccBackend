import type { NextFunction, Request, Response } from "express"
import type { FileScopeDTO } from "../../DTOs/file-scope.DTO"
import type { UpdateFileDTO } from "../../DTOs/update-file.DTO"
import type { FileFilterDTO } from "../../DTOs/file-filter.DTO"

export interface IFileController {
    upload(req: Request<any, any, FileScopeDTO>, res: Response, next: NextFunction): Promise<void>

    findById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    findAllByUserId(req: Request<{ userId: string }, any, any, FileFilterDTO>, res: Response, next: NextFunction): Promise<void>

    update(req: Request<{ id: string }, any, UpdateFileDTO>, res: Response, next: NextFunction): Promise<void>

    delete(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    createAccess(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>

    content(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void>
}
