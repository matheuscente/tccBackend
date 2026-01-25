import express from 'express'
import { routes } from './routes/index/index.routes.js'
import { PageNotFoundMiddleware } from './middlewares/page-not-found.middleware.js'
import { ErrorHandler } from './middlewares/error-handler.middleware.js'

const app = express()

routes(app)
PageNotFoundMiddleware.pageNotFound(app)
ErrorHandler.handler(app)

export default app