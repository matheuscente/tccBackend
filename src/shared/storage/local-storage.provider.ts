import fs from "fs";
import path from "path";
import type { Readable } from "stream";
import { NotFoundError } from "../errors/not-found-error";
import type { ByteRange, IStorageProvider } from "./storage-provider.interface";

/**
 * Armazena os arquivos em disco. Usado em desenvolvimento ou quando o B2 não está configurado.
 */
export class LocalStorageProvider implements IStorageProvider {
    readonly name = "local" as const
    private readonly root: string

    constructor(directory: string) {
        this.root = path.resolve(directory)
        fs.mkdirSync(this.root, { recursive: true })
    }

    async put(key: string, body: Buffer): Promise<void> {
        const target = this.resolve(key)
        await fs.promises.mkdir(path.dirname(target), { recursive: true })
        await fs.promises.writeFile(target, body)
    }

    async getStream(key: string, range?: ByteRange): Promise<Readable> {
        const target = this.resolve(key)

        if (!fs.existsSync(target)) throw new NotFoundError("Arquivo não encontrado no armazenamento")

        return fs.createReadStream(target, range ? { start: range.start, end: range.end } : undefined)
    }

    async delete(key: string): Promise<void> {
        await fs.promises.rm(this.resolve(key), { force: true })
    }

    // impede que uma chave saia da pasta raiz (path traversal)
    private resolve(key: string): string {
        const target = path.resolve(this.root, key)
        if (!target.startsWith(this.root + path.sep)) throw new Error("Chave de armazenamento inválida")
        return target
    }
}
