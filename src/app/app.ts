import express from 'express'
import { routes } from '../routes/index/index.routes'
import { PageNotFoundMiddleware } from '../middlewares/page-not-found.middleware'
import { ErrorHandler } from '../middlewares/error-handler.middleware'

const app = express()

routes(app)
PageNotFoundMiddleware.pageNotFound(app)
ErrorHandler.handler(app)

export default app