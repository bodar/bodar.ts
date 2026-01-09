/**
 * @module
 *
 * Converts SQL template expressions into parameterized statements with numbered placeholders ($1, $2, etc.).
 * Used by PostgreSQL and DuckDB which both support this placeholder style.
 */

import {Sql} from "../template/Sql.ts";
import {Identifier} from "../template/Identifier.ts";
import {Value} from "../template/Value.ts";
import {escapeIdentifier} from "../ansi/escape.ts";

function generatePlaceholders(sql: Sql) {
    let count = 1;
    return sql.generate(e => {
        if (e instanceof Identifier) return escapeIdentifier(e.identifier);
        if (e instanceof Value) return '$' + count++;
        return '';
    });
}

/** Converts SQL template into a parameterized statement with $1, $2, etc. placeholders. */
export function statement(sql: Sql): { text: string; args: unknown[] } {
    return {
        text: generatePlaceholders(sql),
        args: sql.values()
    }
}
