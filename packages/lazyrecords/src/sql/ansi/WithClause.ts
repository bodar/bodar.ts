/**
 * @module
 *
 * An ANSI `WITH` clause: `WITH a AS (…), b AS (…) [body]`, or `WITH RECURSIVE …` when a
 * CTE references itself (SQL:1999). Composes one or more {@link CommonTableExpression}s
 * and, optionally, the statement body they feed.
 */

import {Compound, list} from "../template/Compound.ts";
import {text, Text} from "../template/Text.ts";
import type {Expression} from "../template/Expression.ts";
import type {CommonTableExpression} from "./CommonTableExpression.ts";

/** An ANSI `WITH` / `WITH RECURSIVE` clause. */
export class WithClause extends Compound {
    static with: Text = text("with");
    static recursive: Text = text("recursive");

    constructor(public readonly ctes: readonly CommonTableExpression[], public readonly body?: Expression, public readonly recursive: boolean = false) {
        super([WithClause.with, recursive ? WithClause.recursive : undefined, list(ctes as readonly Expression[]), body].filter(Boolean) as Expression[]);
    }
}

/** Creates an ANSI `WITH` clause over the given CTEs, optionally with a body. */
export function withClause(ctes: readonly CommonTableExpression[], body?: Expression): WithClause {
    return new WithClause(ctes, body);
}

/** Creates an ANSI `WITH RECURSIVE` clause (needed when any CTE references itself). */
export function withRecursive(ctes: readonly CommonTableExpression[], body?: Expression): WithClause {
    return new WithClause(ctes, body, true);
}
