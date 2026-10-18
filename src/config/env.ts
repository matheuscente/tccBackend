import dotenv from "dotenv"

dotenv.config()

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: process.env.PORT ?? "3000",
  allowedOrigins: process.env.CORS_ORIGINS ?? "http://localhost:5173",
  timeZone: process.env.APP_TIMEZONE ?? "America/Sao_Paulo",

  // autenticação
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me",
  fileTokenSecret: process.env.FILE_TOKEN_SECRET ?? process.env.JWT_SECRET ?? "dev-file-secret-change-me",
  cookieSecure: process.env.COOKIE_SECURE === "true",

  // URLs
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  publicApiUrl: process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? "3000"}/api/v1`,

  // e-mail (recuperação de senha). Sem SMTP_HOST, o link é exibido no console.
  smtp: {
    host: process.env.SMTP_HOST,
    port: toNumber(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? "Organizador de Estudos <no-reply@organizador.local>",
  },

  // armazenamento de arquivos. Sem as chaves do B2, usa disco local.
  storage: {
    localDir: process.env.STORAGE_LOCAL_DIR ?? "uploads",
    maxFileSizeMb: toNumber(process.env.MAX_FILE_SIZE_MB, 100),
    b2: {
      endpoint: process.env.B2_ENDPOINT,
      region: process.env.B2_REGION,
      bucket: process.env.B2_BUCKET,
      keyId: process.env.B2_KEY_ID,
      applicationKey: process.env.B2_APPLICATION_KEY,
    },
  },
};
