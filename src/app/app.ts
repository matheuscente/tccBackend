import express from 'express'
import { routes } from '../routes/index/index.routes'
import { PageNotFoundMiddleware } from '../middlewares/page-not-found.middleware'
import { ErrorHandler } from '../middlewares/error-handler.middleware'
import cookieParser from "cookie-parser"

const app = express()

app.use(cookieParser())
routes(app)
PageNotFoundMiddleware.pageNotFound(app)
ErrorHandler.handler(app)

export default app

