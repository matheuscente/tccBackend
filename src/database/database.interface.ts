import type { QueryResult } from "neo4j-driver"

interface DatabaseInterface {
    connectionTest(): void,
    execute(cypher: string, params?: Record<string, unknown>): Promise<QueryResult>
}

export {
    type DatabaseInterface
}