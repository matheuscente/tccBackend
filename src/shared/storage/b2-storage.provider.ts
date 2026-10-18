import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { Readable } from "stream";
import type { ByteRange, IStorageProvider } from "./storage-provider.interface";

interface B2Config {
    endpoint: string
    region: string
    bucket: string
    keyId: string
    applicationKey: string
}

/**
 * Backblaze B2 através da API compatível com S3.
 */
export class B2StorageProvider implements IStorageProvider {
    readonly name = "b2" as const
    private readonly client: S3Client

    constructor(private readonly config: B2Config) {
        this.client = new S3Client({
            endpoint: config.endpoint,
            region: config.region,
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

    async getStream(key: string, range?: ByteRange): Promise<Readable> {
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
