import type { Readable } from "stream";

export interface ByteRange {
    start: number
    end: number
}

export interface IStorageProvider {
    readonly name: "local" | "b2"
    put(key: string, body: Buffer, contentType: string): Promise<void>
    getStream(key: string, range?: ByteRange): Promise<Readable>
    delete(key: string): Promise<void>
}
