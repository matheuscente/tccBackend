// configuração do B2 lida das variáveis de ambiente (todas opcionais: sem nenhuma, os arquivos ficam em disco local)
export interface StorageEnvB2 {
    endpoint?: string | undefined
    region?: string | undefined
    bucket?: string | undefined
    keyId?: string | undefined
    applicationKey?: string | undefined
}

const B2_VARIABLES: Record<keyof StorageEnvB2, string> = {
    endpoint: "B2_ENDPOINT",
    region: "B2_REGION",
    bucket: "B2_BUCKET",
    keyId: "B2_KEY_ID",
    applicationKey: "B2_APPLICATION_KEY",
}

// devolve os problemas encontrados; lista vazia quando o B2 está completo ou totalmente ausente
export const validateStorageEnv = (b2: StorageEnvB2): string[] => {
    const keys = Object.keys(B2_VARIABLES) as (keyof StorageEnvB2)[]
    const filled = keys.filter(key => b2[key]?.trim())

    if (filled.length === 0) return []

    const errors: string[] = []
    const missing = keys.filter(key => !b2[key]?.trim()).map(key => B2_VARIABLES[key])
    if (missing.length) errors.push(`Configuração do B2 incompleta: defina ${missing.join(", ")} ou remova todas as variáveis B2_* para usar o disco local`)

    const endpoint = b2.endpoint?.trim()
    if (endpoint) {
        // http:// só faz sentido no simulador local (b2-local)
        if (!/^https?:\/\//.test(endpoint)) {
            errors.push(`B2_ENDPOINT precisa começar com https:// (ex.: https://s3.us-east-005.backblazeb2.com; http:// apenas no simulador local), recebido: ${endpoint}`)
        } else if (!URL.canParse(endpoint)) {
            errors.push(`B2_ENDPOINT não é uma URL válida: ${endpoint}`)
        }
    }

    return errors
}
