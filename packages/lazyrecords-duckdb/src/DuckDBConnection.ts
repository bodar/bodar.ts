/**
 * @module
 *
 * DuckDB Connection implementation using @duckdb/node-api.
 */

import type {Connection} from "@bodar/lazyrecords/sql/Connection.ts";
import type {Compound} from "@bodar/lazyrecords/sql/template/Compound.ts";
import {sql} from "@bodar/lazyrecords/sql/template/Sql.ts";
import {statement} from "@bodar/lazyrecords/sql/statement/numberedPlaceholder.ts";
import type {DuckDBConnection as NativeDuckDBConnection, DuckDBResultReader, DuckDBValue} from "@duckdb/node-api";

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
    constructor(private readonly native: NativeDuckDBConnection) {}

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
