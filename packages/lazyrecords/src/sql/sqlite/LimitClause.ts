/**
 * @module
 *
 * SQLite `LIMIT m [OFFSET n]` clause. `LIMIT -1` is the SQLite idiom for "no limit"
 * (used to apply an OFFSET without bounding rows). Bounds are spliced as integer
 * literals — this is the ANSI `OFFSET/FETCH` concept in SQLite spelling, hence a
 * dialect node rather than an `ansi/` one.
 */

import {Compound} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** A SQLite `LIMIT m [OFFSET n]` clause. */
export class LimitClause extends Compound {
    static limit: Text = text("limit");
    static offset: Text = text("offset");

    constructor(public readonly count: number, public readonly offset?: number) {
        super([LimitClause.limit, text(String(count)),
            ...(offset === undefined ? [] : [LimitClause.offset, text(String(offset))])] as Expression[]);
    }
}

/** Creates a SQLite `LIMIT count [OFFSET offset]` clause; `count` of -1 means no limit. */
export function limit(count: number, offset?: number): LimitClause {
    return new LimitClause(count, offset);
}
