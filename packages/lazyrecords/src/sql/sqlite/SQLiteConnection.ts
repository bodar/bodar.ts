/**
 * @module
 *
 * SQLite Connection implementation using Bun's SQLite.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/ordinalPlaceholder.ts";

/**
 * A minimal SQLite database interface compatible with Bun's SQLite Database.
 */
export interface SQLiteDatabase {
    query(sql: string): {
        all(...params: unknown[]): unknown[];
        run(...params: unknown[]): { changes: number };
    };
}

/**
 * SQLiteConnection implements Connection for SQLite using Bun's SQLite.
 */
export class SQLiteConnection implements Connection {
    /**
     * Creates a new SQLiteConnection.
     *
     * @param db - The SQLite database instance.
     */
    constructor(private readonly db: SQLiteDatabase) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const result = this.db.query(stmt.text).all(...stmt.args);
        yield* result;
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const result = this.db.query(stmt.text).run(...stmt.args);
        return { rowsChanged: result.changes };
    }
}
