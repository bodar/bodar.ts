/**
 * @module
 *
 * SQL `IN (…)` / `NOT IN (…)` predicate over a list of bound values. The predicand
 * appears at the call site; this node is the predicate tail, mirroring
 * {@link IsExpression}. An empty list renders `in (null)` — valid SQL that matches
 * no rows (SQLite/ANSI reject an empty `IN ()`).
 */

import {parens} from "../template/Compound.ts";
import {text} from "../template/Text.ts";
import {value} from "../template/Value.ts";
import {PredicateExpression} from "./PredicateExpression.ts";

/** A SQL `IN`/`NOT IN` predicate against a list of bound values. */
export class InExpression extends PredicateExpression {
    constructor(public readonly values: readonly unknown[], public readonly negated: boolean = false) {
        super([text(negated ? 'not in' : 'in'),
            values.length === 0 ? text('(null)') : parens(values.map(value))]);
    }
}

/** Creates a SQL `IN (…)` predicate. */
export function inExpression(values: readonly unknown[]): InExpression {
    return new InExpression(values, false);
}

/** Creates a SQL `NOT IN (…)` predicate. */
export function notIn(values: readonly unknown[]): InExpression {
    return new InExpression(values, true);
}
