import neo4j from "neo4j-driver"
import { env } from "../config/env"
import { Database } from "./database"

console.log(env)

const driver = neo4j.driver(
    env.databaseUrl,
    neo4j.auth.basic(
        env.username,
        env.password
    )
)

const databaseTests = new Database(driver)

export {
    databaseTests
} 