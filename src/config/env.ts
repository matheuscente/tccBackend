import dotenv from "dotenv"

dotenv.config({
  override: true,
  path: "../.env"
})

export const env = {
  databaseUrl: process.env.DATABASE_URL!,
  port: process.env.PORT!
};
