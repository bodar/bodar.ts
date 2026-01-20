/**
 * @module
 *
 * DuckDB WASM blocking Connection implementation for Bun/Node environments.
 * Does not require Web Workers - runs on the main thread.
 */

import type {Connection} from "../Connection.ts";
import type {Compound} from "../template/Compound.ts";
import {sql} from "../template/Sql.ts";
import {statement} from "../statement/ordinalPlaceholder.ts";
import {toObjects, getRowsChanged} from "./DuckDBWasm.ts";
import {ConsoleLogger, createDuckDB, NODE_RUNTIME, type DuckDBBindings, type DuckDBConnection as DuckDBSyncConnection} from "@duckdb/duckdb-wasm/blocking";

export type {DuckDBBindings, DuckDBSyncConnection};

/**
 * DuckDBWasmBlockingConnection implements Connection using the blocking (synchronous) DuckDB WASM API.
 * Useful for Bun/Node testing where Web Workers aren't fully supported.
 */
export class DuckDBWasmBlockingConnection implements Connection {
    constructor(private readonly conn: DuckDBSyncConnection) {}

    async *query(expr: Compound): AsyncIterable<unknown> {
        const stmt = statement(sql(expr));
        const prepared = this.conn.prepare(stmt.text);
        const table = prepared.query(...stmt.args);
        yield* toObjects(table);
        prepared.close();
    }

    async execute(expr: Compound): Promise<{ rowsChanged: number }> {
        const stmt = statement(sql(expr));
        const prepared = this.conn.prepare(stmt.text);
        const table = prepared.query(...stmt.args);
        prepared.close();
        return { rowsChanged: getRowsChanged(table) };
    }
}

/**
 * Creates a DuckDB WASM instance using the blocking (synchronous) variant.
 * Does not require Web Workers - runs on the main thread.
 *
 * Useful for testing in Bun/Node environments where Workers may not be fully supported.
 * Note: This blocks the main thread during queries.
 *
 * @returns A promise that resolves to an initialized DuckDBBindings instance.
 */
export async function createDuckDBWasmBlocking(): Promise<DuckDBBindings> {
    const logger = new ConsoleLogger();
    // Convert file:// URL to path for Node runtime
    const wasmUrl = import.meta.resolve("@duckdb/duckdb-wasm/dist/duckdb-eh.wasm");
    const wasmPath = wasmUrl.startsWith("file://") ? wasmUrl.slice(7) : wasmUrl;

    const db = await createDuckDB(
        { mvp: { mainModule: wasmPath, mainWorker: '' }, eh: { mainModule: wasmPath, mainWorker: '' } },
        logger,
        NODE_RUNTIME
    );

    // Instantiate the WASM module before returning
    await db.instantiate(() => {});

    return db as DuckDBBindings;
}
