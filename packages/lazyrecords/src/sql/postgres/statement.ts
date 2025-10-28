/**
 * @module
 *
 * Converts SQL template expressions into PostgreSQL parameterized statements.
 *
 * Transforms SQL templates into the format required by PostgreSQL client libraries,
 * with positional parameters ($1, $2, etc.) and properly escaped identifiers.
 *
 * @example
 * ```ts
 * import { statement } from "@bodar/lazyrecords/sql/postgres/statement.ts";
 * import { sql } from "@bodar/lazyrecords/sql/template/Sql.ts";
 *
 * const query = sql`select * from users where id = ${123} and name = ${"Alice"}`;
 * const { text, args } = statement(query);
 * // text: "select * from users where id = $1 and name = $2"
 * // args: [123, "Alice"]
 * ```
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

export function statement(sql: Sql): { text: string; args: unknown[] } {
    return {
        text: generatePlaceholders(sql),
        args: sql.values()
    }
}



