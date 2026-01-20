/**
 * @module
 *
 * JSR-compatible type definitions for Bun's database APIs.
 *
 * These interfaces are structurally compatible with Bun's native types
 * (Database from bun:sqlite, SQL/ReservedSQL from bun) but defined here
 * because JSR uses Deno for documentation generation, which cannot resolve
 * Bun-specific module specifiers like "bun" or "bun:sqlite".
 *
 * When using this library with Bun, you can pass the native Bun types
 * directly - TypeScript's structural typing ensures compatibility.
 */

/**
 * SQLite query binding types - compatible with Bun's SQLQueryBindings.
 */
export type SQLiteBindings = string | bigint | number | boolean | null | Uint8Array;

/**
 * SQLite database interface compatible with Bun's Database from bun:sqlite.
 */
export interface SQLiteDatabase {
    query(sql: string): {
        all(...params: SQLiteBindings[]): unknown[];
        run(...params: SQLiteBindings[]): { changes: number };
    };
}

/**
 * SQL query result interface compatible with Bun's SQLQuery.
 */
export interface SQLQueryResult extends Promise<unknown[] & { count?: number }> {
    count?: number;
}

/**
 * SQL client interface compatible with Bun's SQL from bun.
 * Supports parameterized queries via the unsafe() method.
 */
export interface PostgresSQL {
    unsafe(query: string, params?: unknown[]): SQLQueryResult;
    reserve(): Promise<PostgresReservedSQL>;
}

/**
 * Reserved SQL connection interface compatible with Bun's ReservedSQL.
 * Extends PostgresSQL with a release() method to return the connection to the pool.
 */
export interface PostgresReservedSQL extends PostgresSQL {
    release(): void;
}
