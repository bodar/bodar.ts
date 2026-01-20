/**
 * @module
 *
 * PostgreSQL Connection implementation using Bun's SQL client.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/numberedPlaceholder.ts";

/**
 * A SQL client interface that can execute queries with parameters.
 * Compatible with Bun's SQL pool or reserved connection.
 */
export interface PostgresClient {
    (query: string, params: unknown[]): Promise<unknown[] & { count?: number }>;
}

/**
 * Bun SQL pool interface for creating connections.
 */
export interface PostgresPool extends PostgresClient {
    reserve(): Promise<PostgresClient & { release(): void }>;
}

/**
 * PostgresConnection implements Connection for PostgreSQL using Bun's SQL client.
 */
export class PostgresConnection implements Connection {
    /**
     * Creates a new PostgresConnection.
     *
     * @param client - The SQL client (pool or reserved connection from Bun SQL).
     */
    constructor(private readonly client: PostgresClient) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const result = await this.client(stmt.text, stmt.args);
        yield* result;
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const result = await this.client(stmt.text, stmt.args);
        return { rowsChanged: result.count ?? 0 };
    }
}
