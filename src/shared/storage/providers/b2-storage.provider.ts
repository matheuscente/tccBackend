import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import type { ByteRangeDTO } from "../DTOs/byte-range.DTO";
import type { IStorageProvider } from "../interfaces/storage-provider.interface";

interface B2Config {
    endpoint: string
    region: string
    bucket: string
    keyId: string
    applicationKey: string
    forcePathStyle: boolean
}

// Backblaze B2 pela API compatível com S3; também atende o simulador local (b2-local)
export class B2StorageProvider implements IStorageProvider {
    readonly name = "b2" as const
    private readonly client: S3Client

    constructor(private readonly config: B2Config) {
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
            forcePathStyle: config.forcePathStyle,
            // o B2 não aceita os checksums que o SDK passou a enviar por padrão
            requestChecksumCalculation: "WHEN_REQUIRED",
            responseChecksumValidation: "WHEN_REQUIRED",
            credentials: {
                accessKeyId: config.keyId,
                secretAccessKey: config.applicationKey
            }
        })
    }

    async put(key: string, body: Buffer, contentType: string): Promise<void> {
        await this.client.send(new PutObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            Body: body,
            ContentType: contentType
        }))
    }

    async getStream(key: string, range?: ByteRangeDTO): Promise<Readable> {
        const result = await this.client.send(new GetObjectCommand({
            Bucket: this.config.bucket,
            Key: key,
            ...(range ? { Range: `bytes=${range.start}-${range.end}` } : {})
        }))

        return result.Body as Readable
    }

    async delete(key: string): Promise<void> {
        await this.client.send(new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }))
    }
}
