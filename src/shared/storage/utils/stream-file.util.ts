import type { Request, Response } from "express";
import type { IStorageProvider } from "../interfaces/storage-provider.interface";

interface StreamableFile {
    storageKey: string
    mimeType: string
    size: number
    originalName: string
}

// suporte a Range permite avançar/retroceder vídeos e áudios sem baixar o arquivo inteiro
export const streamFile = async (
    req: Request,
    res: Response,
    storage: IStorageProvider,
    file: StreamableFile,
    asAttachment: boolean
): Promise<void> => {
    const disposition = `${asAttachment ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(file.originalName)}`

    res.setHeader("Content-Type", file.mimeType)
    res.setHeader("Content-Disposition", disposition)
    res.setHeader("Accept-Ranges", "bytes")
    res.setHeader("Cache-Control", "private, max-age=300")
    res.setHeader("X-Content-Type-Options", "nosniff")

    const rangeHeader = req.headers.range
    let range: { start: number, end: number } | undefined

    if (rangeHeader && !asAttachment && file.size > 0) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader)

        if (match && (match[1] || match[2])) {
            let start = match[1] ? parseInt(match[1], 10) : NaN
            let end = match[2] ? parseInt(match[2], 10) : NaN

            if (Number.isNaN(start)) {
                // sufixo: últimos N bytes
                start = Math.max(0, file.size - end)
                end = file.size - 1
            } else if (Number.isNaN(end) || end >= file.size) {
                end = file.size - 1
            }

            if (start > end || start >= file.size) {
                res.status(416).setHeader("Content-Range", `bytes */${file.size}`).end()
                return
            }

            range = { start, end }
        }
    }

    const stream = await storage.getStream(file.storageKey, range)

    if (range) {
        res.status(206)
        res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${file.size}`)
        res.setHeader("Content-Length", String(range.end - range.start + 1))
    } else {
        res.status(200)
        res.setHeader("Content-Length", String(file.size))
    }

    stream.on("error", () => res.destroy())
    stream.pipe(res)
}
