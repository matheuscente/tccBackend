import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { scopeQuerySchema, userIdParamSchema } from "../../../shared/schemas/scope-fields.schema"
import { fileUpload } from "../../../middlewares/upload.middleware"
import { fileContentQuerySchema, updateFileSchema, uploadFileSchema } from "../validators/file.schema"

export const fileRoutes = express.Router()

const controller = container.fileController
const authentication = container.authenticationMiddleware
const byId = RequestValidator.paramsValidator(FindByIdSchema)

fileRoutes.get('/id/:id', byId, authentication, controller.findById)

fileRoutes.get('/user/:userId', RequestValidator.paramsValidator(userIdParamSchema), RequestValidator.queryValidator(scopeQuerySchema), authentication, controller.findAllByUserId)

// autenticação antes do multer: o upload só é lido de usuários autenticados
fileRoutes.post('/', authentication, fileUpload.single("file"), RequestValidator.bodyValidator(uploadFileSchema), controller.upload)

fileRoutes.get('/:id/access', byId, authentication, controller.createAccess)

fileRoutes.get('/:id/content', byId, RequestValidator.queryValidator(fileContentQuerySchema), controller.content)

fileRoutes.patch('/:id', byId, RequestValidator.bodyValidator(updateFileSchema), authentication, controller.update)

fileRoutes.delete('/:id', byId, authentication, controller.delete)
