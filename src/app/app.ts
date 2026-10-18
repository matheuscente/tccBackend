import express from 'express'
import { routes } from '../routes/index/index.routes'
import { PageNotFoundMiddleware } from '../middlewares/page-not-found.middleware'
import { ErrorHandler } from '../middlewares/error-handler.middleware'
import cookieParser from "cookie-parser"
import cors from "cors"
import { env } from '../config/env'

const app = express()

app.disable("x-powered-by")
app.set("trust proxy", 1)
const allowedOrigins = (env.allowedOrigins ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cookieParser())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      callback(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Range"],
    exposedHeaders: ["Content-Disposition", "Content-Range", "Accept-Ranges"],
    maxAge: 600,
  })
);
routes(app)
PageNotFoundMiddleware.pageNotFound(app)
ErrorHandler.handler(app)

export default app

