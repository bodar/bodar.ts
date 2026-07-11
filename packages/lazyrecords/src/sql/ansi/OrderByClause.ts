/**
 * @module
 *
 * An ANSI `ORDER BY e1 [ASC|DESC], e2 …` clause over one or more sort keys. Each key is
 * an arbitrary expression (a column, a `json_extract(…)`, `random()`, …) with an
 * optional direction.
 */

import {Compound, expression, list} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** Sort direction for an ORDER BY key. */
export type Direction = 'asc' | 'desc';

/** A single ORDER BY sort key. */
export interface OrderKey {
    expression: Expression;
    direction?: Direction;
}

/** An ANSI `ORDER BY` clause over one or more sort keys. */
export class OrderByClause extends Compound {
    static orderBy: Text = text("order by");

    constructor(public readonly keys: readonly OrderKey[]) {
        super([OrderByClause.orderBy, list(keys.map(k =>
            k.direction ? expression(k.expression, text(k.direction)) : k.expression))]);
    }
}

/** Creates an ANSI `ORDER BY` clause. */
export function orderBy(keys: readonly OrderKey[]): OrderByClause {
    return new OrderByClause(keys);
}
