import type { IStorageProvider } from "../interfaces/storage-provider.interface"

// remove o objeto do armazenamento sem interromper a operação principal:
// a falha fica registrada no log (com a chave) para limpeza manual no bucket
export const safeDeleteStoredObject = async (storage: IStorageProvider, storageKey: string, context: string): Promise<void> => {
    try {
        await storage.delete(storageKey)
    } catch (err) {
        console.error(`Falha ao remover o objeto "${storageKey}" do armazenamento (${context})`, err)
    }
}
