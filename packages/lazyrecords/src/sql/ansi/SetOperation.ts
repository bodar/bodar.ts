/**
 * @module
 *
 * ANSI set operations combining two or more query bodies: `a UNION ALL b`, `a UNION b`,
 * `a INTERSECT b`, `a EXCEPT b`.
 */

import {Compound} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** The ANSI set operators. */
export type SetOperator = 'union' | 'union all' | 'intersect' | 'except';

/** An ANSI set operation over two or more query bodies. */
export class SetOperation extends Compound {
    constructor(public readonly operator: SetOperator, public readonly selects: readonly Expression[]) {
        super(selects, text(` ${operator} `));
    }
}

/** Creates a `UNION ALL` of the given query bodies. */
export function unionAll(...selects: readonly Expression[]): SetOperation {
    return new SetOperation('union all', selects);
}

/** Creates a `UNION` of the given query bodies. */
export function union(...selects: readonly Expression[]): SetOperation {
    return new SetOperation('union', selects);
}
