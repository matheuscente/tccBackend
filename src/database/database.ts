import type { Driver, QueryResult } from "neo4j-driver";
import type { DatabaseInterface } from "./database.interface";

export class Database implements DatabaseInterface {

    constructor(
        private readonly driver: Driver
    ) {}

    connectionTest = async () => {
        const session = this.driver.session();

        try {
            const result = await session.run(`
                RETURN "Neo4j conectado!" AS message
            `);

            if (result.records[0]) {
                console.log(result.records[0].get("message"));
                
            }
        } catch (err) {
            console.error(err);
            throw err
        } finally {
            await session.close();
        }
    }

    execute = async (cypher: string, params?: Record<string, unknown>): Promise<QueryResult> => {
        const session = this.driver.session()

        try {
            console.log(cypher, params)
            return await session.run(cypher, params)
        } finally {
            await session.close()
        }
    }
}