import dotenv from "dotenv"

dotenv.config()

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: process.env.PORT!,
  username: process.env.DATABASE_USERNAME!,
  password: process.env.DATABASE_PASSWORD!,
};
