import "../src/env.js"

import { startBDTest } from "./tests/bdStartTest.js";

  console.log(process.env.DATABASE_URL)

await startBDTest()