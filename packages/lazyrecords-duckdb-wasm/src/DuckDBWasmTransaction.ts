/**
 * @module
 *
 * DuckDB WASM Transaction implementation.
 */

import type {Connection} from "@bodar/lazyrecords/sql/Connection.ts";
import type {Transaction} from "@bodar/lazyrecords/Transaction.ts";
import {expression} from "@bodar/lazyrecords/sql/template/Compound.ts";
import {text} from "@bodar/lazyrecords/sql/template/Text.ts";
import {SqlTransaction} from "@bodar/lazyrecords/sql/SqlTransaction.ts";

/**
 * Creates a Transaction for DuckDB WASM wrapping a Connection.
 */
export function duckdbWasmTransaction(connection: Connection): Transaction {
    return new SqlTransaction(
        connection,
        expression(text("BEGIN TRANSACTION")),
        expression(text("COMMIT")),
        expression(text("ROLLBACK"))
    );
}
