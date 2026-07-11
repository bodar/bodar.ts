/**
 * @module
 *
 * SQLite `json_extract(col, '$.key')` expression with index-eligible literal-path splicing.
 *
 * A safe identifier key is spliced as a raw literal (`'$.age'`) so SQLite's query
 * planner can match an expression index built on the same literal path. An exotic
 * key (spaces/dots/unicode) is bound (`'$.' || ?`) — it can never be an index
 * target anyway. `indexKey` reports the spliced safe key (or `null`) so callers can
 * build/report the matching expression index.
 */

import {Compound} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {value} from "../template/Value.ts";
import type {Expression} from "../template/Expression.ts";

/** Matches a SQLite JSON key safe to splice as a raw literal path (identifier-shaped). */
export const SAFE_KEY: RegExp = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** A SQLite `json_extract(column, '$.key')` expression. */
export class JsonExtract extends Compound {
    /** The safe key spliced as a literal path (index-eligible), or `null` when the key was bound. */
    readonly indexKey: string | null;

    constructor(public readonly column: Expression, public readonly key: string) {
        const safe = SAFE_KEY.test(key);
        super(safe
            ? [text("json_extract("), column, text(`, '$.${key}')`)]
            : [text("json_extract("), column, text(", '$.' || "), value(key), text(")")],
            text(""));
        this.indexKey = safe ? key : null;
    }
}

/** Creates a SQLite `json_extract(column, '$.key')` expression. */
export function jsonExtract(column: Expression, key: string): JsonExtract {
    return new JsonExtract(column, key);
}
