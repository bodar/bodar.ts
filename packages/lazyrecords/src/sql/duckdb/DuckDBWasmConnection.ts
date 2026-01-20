/**
 * @module
 *
 * DuckDB WASM async Connection implementation using Web Workers.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/ordinalPlaceholder.ts";
import {toObjects, getRowsChanged} from "./DuckDBWasm.ts";
import {AsyncDuckDB, ConsoleLogger, type AsyncDuckDBConnection} from "@duckdb/duckdb-wasm";

/**
 * DuckDBWasmConnection implements Connection for DuckDB WASM (async/worker-based).
 */
export class DuckDBWasmConnection implements Connection {
    constructor(private readonly conn: AsyncDuckDBConnection) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const prepared = await this.conn.prepare(stmt.text);
        const table = await prepared.query(...stmt.args);
        yield* toObjects(table);
        await prepared.close();
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const prepared = await this.conn.prepare(stmt.text);
        const table = await prepared.query(...stmt.args);
        await prepared.close();
        return { rowsChanged: getRowsChanged(table) };
    }
}

/**
 * Options for creating a DuckDB WASM instance.
 */
export interface DuckDBWasmOptions {
    /** URL to the main WASM module. Defaults to EH bundle relative to import.meta.url. */
    mainModule?: string;
    /** URL to the main worker script. Defaults to EH worker relative to import.meta.url. */
    mainWorker?: string;
}

/**
 * Creates a DuckDB WASM instance with explicit bundle URLs.
 *
 * By default, expects WASM files to be served from the same location as this module:
 * - duckdb-eh.wasm
 * - duckdb-browser-eh.worker.js
 *
 * @param options - Optional URLs for WASM module and worker.
 * @returns A promise that resolves to an initialized AsyncDuckDB instance.
 */
export async function createDuckDBWasm(options?: DuckDBWasmOptions): Promise<AsyncDuckDB> {
    const baseUrl = new URL(".", import.meta.url).href;
    const mainModule = options?.mainModule ?? `${baseUrl}duckdb-eh.wasm`;
    const mainWorker = options?.mainWorker ?? `${baseUrl}duckdb-browser-eh.worker.js`;

    const worker = new Worker(mainWorker, { type: "module" });
    const logger = new ConsoleLogger();
    const db = new AsyncDuckDB(logger, worker);
    await db.instantiate(mainModule);

    return db;
}
