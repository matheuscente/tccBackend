import { env } from "../../config/env";
import { B2StorageProvider } from "./providers/b2-storage.provider";
import { LocalStorageProvider } from "./providers/local-storage.provider";
import type { IStorageProvider } from "./interfaces/storage-provider.interface";
import { validateStorageEnv } from "./utils/validate-storage-env.util";

export const createStorageProvider = (): IStorageProvider => {
    const b2 = env.storage.b2

    // falha já na subida da API, com uma mensagem clara, em vez de quebrar no primeiro upload
    const errors = validateStorageEnv(b2)
    if (errors.length) throw new Error(`Variáveis de armazenamento inválidas:\n- ${errors.join("\n- ")}`)

    if (b2.endpoint && b2.region && b2.bucket && b2.keyId && b2.applicationKey) {
        return new B2StorageProvider({
            endpoint: b2.endpoint,
            region: b2.region,
            bucket: b2.bucket,
            keyId: b2.keyId,
            applicationKey: b2.applicationKey,
            forcePathStyle: b2.forcePathStyle
        })
    }

    return new LocalStorageProvider(env.storage.localDir)
}
