import { env } from "../../config/env";
import { B2StorageProvider } from "./b2-storage.provider";
import { LocalStorageProvider } from "./local-storage.provider";
import type { IStorageProvider } from "./storage-provider.interface";

export const createStorageProvider = (): IStorageProvider => {
    const b2 = env.storage.b2

    if (b2.endpoint && b2.region && b2.bucket && b2.keyId && b2.applicationKey) {
        return new B2StorageProvider({
            endpoint: b2.endpoint,
            region: b2.region,
            bucket: b2.bucket,
            keyId: b2.keyId,
            applicationKey: b2.applicationKey
        })
    }

    return new LocalStorageProvider(env.storage.localDir)
}
