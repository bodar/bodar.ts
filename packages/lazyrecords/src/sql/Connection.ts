/**
 * @module
 *
 * Connection and Transaction interfaces for database access.
 */

import type {Compound} from "./template/Compound.ts";

/**
 * Connection interface for executing SQL queries and mutations.
 */
export interface Connection {
    /**
     * Executes a SELECT query and returns results as an async iterable.
     *
     * @param sql - The SQL expression to execute.
     * @returns An async iterable of result rows.
     */
    query(sql: Compound): AsyncIterable<unknown>;

    /**
     * Executes a mutation (INSERT/UPDATE/DELETE) or DDL statement.
     *
     * @param sql - The SQL expression to execute.
     * @returns The number of rows affected.
     */
    execute(sql: Compound): Promise<{ rowsChanged: number }>;
}

