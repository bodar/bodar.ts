/**
 * @module
 *
 * Converts SQL template expressions into PostgreSQL parameterized statements with positional parameters ($1, $2, etc.).
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

/** Converts SQL template into a PostgreSQL parameterized statement with $1, $2, etc. placeholders. */
export function statement(sql: Sql): { text: string; args: unknown[] } {
    return {
        text: generatePlaceholders(sql),
        args: sql.values()
    }
}



