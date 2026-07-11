/**
 * @module
 *
 * SQL `LIKE` / `NOT LIKE` predicate over a bound pattern, with an optional bound
 * `ESCAPE` character (for matching literal `%`/`_` after escaping them in the pattern).
 * The predicand appears at the call site; this node is the predicate tail, mirroring
 * {@link IsExpression}.
 */

import {text, Text} from "../template/Text.ts";
import {value} from "../template/Value.ts";
import {PredicateExpression} from "./PredicateExpression.ts";

/** A SQL `LIKE` / `NOT LIKE` predicate against a bound pattern. */
export class LikeExpression extends PredicateExpression {
    static like: Text = text("like");
    static notLike: Text = text("not like");
    static escape: Text = text("escape");

    constructor(public readonly pattern: unknown, public readonly negated: boolean = false, public readonly escape?: string) {
        super([negated ? LikeExpression.notLike : LikeExpression.like, value(pattern),
            ...(escape === undefined ? [] : [LikeExpression.escape, value(escape)])]);
    }
}

/** Creates a SQL `LIKE pattern [ESCAPE c]` predicate. */
export function like(pattern: unknown, escape?: string): LikeExpression {
    return new LikeExpression(pattern, false, escape);
}

/** Creates a SQL `NOT LIKE pattern [ESCAPE c]` predicate. */
export function notLike(pattern: unknown, escape?: string): LikeExpression {
    return new LikeExpression(pattern, true, escape);
}
