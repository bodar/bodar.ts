/**
 * @module
 *
 * PostgreSQL Connection implementation using Bun's SQL client.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import type {PostgresSQL, PostgresReservedSQL} from "../bun-types.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/numberedPlaceholder.ts";

/**
 * PostgresConnection implements Connection for PostgreSQL using Bun's SQL client.
 */
export class PostgresConnection implements Connection {
    /**
     * Creates a new PostgresConnection.
     *
     * @param client - The SQL client (Bun's SQL pool or ReservedSQL connection).
     */
    constructor(private readonly client: PostgresSQL | PostgresReservedSQL) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const result = await this.client.unsafe(stmt.text, stmt.args);
        yield* result;
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const result = await this.client.unsafe(stmt.text, stmt.args);
        return { rowsChanged: result.count ?? 0 };
    }
}
