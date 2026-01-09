/**
 * @module
 *
 * Converts SQL template expressions into parameterized statements with ordinal placeholders (?).
 * Used by SQLite and MySQL which use this placeholder style.
 */

import {Sql} from "../template/Sql.ts";
import {Identifier} from "../template/Identifier.ts";
import {Value} from "../template/Value.ts";
import {escapeIdentifier} from "../ansi/escape.ts";

function generatePlaceholders(sql: Sql) {
    return sql.generate(e => {
        if (e instanceof Identifier) return escapeIdentifier(e.identifier);
        if (e instanceof Value) return '?';
        return '';
    });
}

/** Converts SQL template into a parameterized statement with ? placeholders. */
export function statement(sql: Sql): { text: string; args: unknown[] } {
    return {
        text: generatePlaceholders(sql),
        args: sql.values()
    }
}
