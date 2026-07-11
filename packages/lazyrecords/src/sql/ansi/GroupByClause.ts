/**
 * @module
 *
 * An ANSI `GROUP BY e1, e2, …` clause over one or more grouping expressions.
 */

import {Compound, list} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** An ANSI `GROUP BY` clause. */
export class GroupByClause extends Compound {
    static groupBy: Text = text("group by");

    constructor(public readonly keys: readonly Expression[]) {
        super([GroupByClause.groupBy, list(keys)]);
    }
}

/** Creates an ANSI `GROUP BY` clause. */
export function groupBy(keys: readonly Expression[]): GroupByClause {
    return new GroupByClause(keys);
}
