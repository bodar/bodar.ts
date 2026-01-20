/**
 * @module
 *
 * DuckDB Connection implementation using @duckdb/node-api.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/numberedPlaceholder.ts";
import type {DuckDBResultReader, DuckDBValue} from "@duckdb/node-api";

/**
 * A DuckDB native connection interface compatible with @duckdb/node-api.
 */
export interface DuckDBNativeConnection {
    runAndReadAll(sql: string, params?: DuckDBValue[]): Promise<DuckDBResultReader>;
}

/**
 * A DuckDB instance interface for creating connections.
 */
export interface DuckDBInstance {
    connect(): Promise<DuckDBNativeConnection>;
}

/**
 * Converts array-of-arrays result to array-of-objects using column names.
 */
function toObjects(result: DuckDBResultReader): unknown[] {
    const columns = result.columnNames();
    return result.getRows().map(row =>
        Object.fromEntries(columns.map((col, i) => [col, row[i]]))
    );
}

/**
 * DuckDBConnection implements Connection for DuckDB using @duckdb/node-api.
 */
export class DuckDBConnection implements Connection {
    /**
     * Creates a new DuckDBConnection.
     *
     * @param native - The DuckDB native connection instance.
     */
    constructor(private readonly native: DuckDBNativeConnection) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const result = await this.native.runAndReadAll(stmt.text, stmt.args as DuckDBValue[]);
        yield* toObjects(result);
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const result = await this.native.runAndReadAll(stmt.text, stmt.args as DuckDBValue[]);
        return { rowsChanged: result.rowsChanged };
    }
}
