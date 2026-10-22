import type { Readable } from "stream";
import type { ByteRangeDTO } from "../DTOs/byte-range.DTO";

export interface IStorageProvider {
    readonly name: "local" | "b2"
    put(key: string, body: Buffer, contentType: string): Promise<void>
    getStream(key: string, range?: ByteRangeDTO): Promise<Readable>
    delete(key: string): Promise<void>
}
