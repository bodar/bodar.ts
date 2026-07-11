/**
 * @module
 *
 * A non-recursive ANSI `WITH` clause: `WITH a AS (…), b AS (…) [body]`. Composes one
 * or more {@link CommonTableExpression}s and, optionally, the statement body they
 * feed. (SQL:1999.)
 */

import {Compound, list} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";
import type {CommonTableExpression} from "./CommonTableExpression.ts";

/** A non-recursive ANSI `WITH` clause. */
export class WithClause extends Compound {
    static with: Text = text("with");

    constructor(public readonly ctes: readonly CommonTableExpression[], public readonly body?: Expression) {
        super([WithClause.with, list(ctes as readonly Expression[]), body].filter(Boolean) as Expression[]);
    }
}

/** Creates a non-recursive ANSI `WITH` clause over the given CTEs, optionally with a body. */
export function withClause(ctes: readonly CommonTableExpression[], body?: Expression): WithClause {
    return new WithClause(ctes, body);
}
