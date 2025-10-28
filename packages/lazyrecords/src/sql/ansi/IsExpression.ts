/**
 * @module
 *
 * ANSI SQL IS NULL / IS NOT NULL expressions for null-safe comparisons.
 */

import {text, Text} from "../template/Text.ts";
import {Value} from "../template/Value.ts";
import {PredicateExpression} from "./PredicateExpression.ts";
import {Expression} from "../template/Expression.ts";

/** SQL IS/= expression that automatically handles NULL comparisons. */
export class IsExpression extends PredicateExpression {
    static equals: Text = text("=");
    static is: Text = text("is");

    private static convert(value: unknown): Expression[] {
        if (value === undefined || value === null) return [IsExpression.is, new Value(null)];
        return [IsExpression.equals, new Value(value)];
    }

    constructor(public readonly value: unknown) {
        super(IsExpression.convert(value));
    }
}

/** Creates an IS or = expression depending on whether the value is null. */
export function is(instance: unknown): IsExpression {
    return new IsExpression(instance);
}