/**
 * @module
 *
 * SQL `EXISTS (subquery)` / `NOT EXISTS (subquery)` boolean predicate. The body is any
 * query expression (typically a correlated `SELECT 1 …`).
 */

import {Compound, parens} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";

/** A SQL `EXISTS` / `NOT EXISTS` predicate over a subquery body. */
export class ExistsExpression extends Compound {
    static exists: Text = text("exists");
    static notExists: Text = text("not exists");

    constructor(public readonly body: Expression, public readonly negated: boolean = false) {
        super([negated ? ExistsExpression.notExists : ExistsExpression.exists, parens([body])], text(""));
    }
}

/** Creates a SQL `EXISTS (body)` predicate. */
export function exists(body: Expression): ExistsExpression {
    return new ExistsExpression(body, false);
}

/** Creates a SQL `NOT EXISTS (body)` predicate. */
export function notExists(body: Expression): ExistsExpression {
    return new ExistsExpression(body, true);
}
