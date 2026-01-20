/**
 * @module
 *
 * DuckDB Transaction implementation.
 */

import type {Connection} from "../Connection.ts";
import {type Transaction} from "../../Transaction.ts";
import {expression} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {SqlTransaction} from "../SqlTransaction.ts";

/**
 * Creates a Transaction for DuckDB wrapping a Connection.
 */
export function duckdbTransaction(connection: Connection): Transaction {
    return new SqlTransaction(
        connection,
        expression(text("BEGIN TRANSACTION")),
        expression(text("COMMIT")),
        expression(text("ROLLBACK"))
    );
}
