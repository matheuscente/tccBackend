import app from './app.js'
import { env } from './config/env.js'
import { startBDTest } from './tests/bdStartTest.js'

const port = env.port

await startBDTest()

app.listen(port, () => {
    console.log(`app running in ${port} port`)
})