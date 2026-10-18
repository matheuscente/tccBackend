import dotenv from "dotenv"

dotenv.config()

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: process.env.PORT!,
  allowedOrigins: process.env.CORS_ORIGINS!
};
