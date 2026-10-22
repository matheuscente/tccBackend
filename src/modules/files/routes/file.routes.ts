import express from "express"
import { RequestValidator } from "../../../middlewares/data-validator.middleware"
import { container } from "../../../app/container-dependencies"
import { FindByIdSchema } from "../../../shared/schemas/find-by-id.schema"
import { fileUpload } from "../../../middlewares/upload.middleware"
import { uploadFileSchema } from "../validators/upload-file.schema"
import { updateFileSchema } from "../validators/update-file.schema"
import { contentFileSchema } from "../validators/content-file.schema"
import { findAllByUserIdFileSchema } from "../validators/findAllByUserId-file.schema"
import { filterFileSchema } from "../validators/filter-file.schema"

export const fileRoutes = express.Router()

const fileController = container.fileController
const authentication = container.authenticationMiddleware

fileRoutes.get('/id/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, fileController.findById)

fileRoutes.get('/user/:userId', RequestValidator.paramsValidator(findAllByUserIdFileSchema), RequestValidator.queryValidator(filterFileSchema), authentication, fileController.findAllByUserId)

// autenticação antes do multer: o corpo do upload só é lido para usuários autenticados
fileRoutes.post('/', authentication, fileUpload.single("file"), RequestValidator.bodyValidator(uploadFileSchema), fileController.upload)

fileRoutes.get('/:id/access', RequestValidator.paramsValidator(FindByIdSchema), authentication, fileController.createAccess)

fileRoutes.get('/:id/content', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.queryValidator(contentFileSchema), fileController.content)

fileRoutes.patch('/:id', RequestValidator.paramsValidator(FindByIdSchema), RequestValidator.bodyValidator(updateFileSchema), authentication, fileController.update)

fileRoutes.delete('/:id', RequestValidator.paramsValidator(FindByIdSchema), authentication, fileController.delete)
