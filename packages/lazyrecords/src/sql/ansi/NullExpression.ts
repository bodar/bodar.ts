/**
 * @module
 *
 * SQL null-test predicate `IS NULL` / `IS NOT NULL`. The predicand appears at the call
 * site; this node is the predicate tail, mirroring {@link IsExpression}. (Distinct from
 * `IsExpression`, which produces `= value` or `is null` for a *concrete* value.)
 */

import {text, Text} from "../template/Text.ts";
import {PredicateExpression} from "./PredicateExpression.ts";

/** A SQL `IS NULL` / `IS NOT NULL` predicate. */
export class NullExpression extends PredicateExpression {
    static is: Text = text("is");
    static isNot: Text = text("is not");
    static null: Text = text("null");

    constructor(public readonly negated: boolean = false) {
        super([negated ? NullExpression.isNot : NullExpression.is, NullExpression.null]);
    }
}

/** Creates a SQL `IS NULL` predicate. */
export function isNull(): NullExpression {
    return new NullExpression(false);
}

/** Creates a SQL `IS NOT NULL` predicate. */
export function isNotNull(): NullExpression {
    return new NullExpression(true);
}
