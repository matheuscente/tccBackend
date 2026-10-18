import multer from "multer";
import { env } from "../config/env";
import { ValidationError } from "../shared/errors/validation-error";

/**
 * Upload em memória; o service envia o buffer para o armazenamento (B2 ou disco).
 */
export const fileUpload = multer({
    storage: multer.memoryStorage(),
    defParamCharset: "utf8",
    limits: { fileSize: env.storage.maxFileSizeMb * 1024 * 1024, files: 1 }
})

const IMAGE_MAX_MB = 5

export const imageUpload = multer({
    storage: multer.memoryStorage(),
    defParamCharset: "utf8",
    limits: { fileSize: IMAGE_MAX_MB * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, callback) => {
        if (!/^image\/(png|jpe?g|gif|webp)$/.test(file.mimetype)) {
            return callback(new ValidationError("Envie apenas imagens PNG, JPG, GIF ou WEBP"))
        }
        callback(null, true)
    }
})
