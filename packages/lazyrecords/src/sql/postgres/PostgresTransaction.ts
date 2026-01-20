/**
 * @module
 *
 * PostgreSQL Transaction implementation.
 */

import type {Connection} from "../Connection.ts";
import {type Transaction} from "../../Transaction.ts";
import {expression} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {SqlTransaction} from "../SqlTransaction.ts";

/**
 * Creates a Transaction for PostgreSQL wrapping a Connection.
 */
export function postgresTransaction(connection: Connection): Transaction {
    return new SqlTransaction(
        connection,
        expression(text("BEGIN")),
        expression(text("COMMIT")),
        expression(text("ROLLBACK"))
    );
}
