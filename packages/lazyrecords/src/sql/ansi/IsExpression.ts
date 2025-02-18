import {text} from "../template/Text.ts";
import {Value} from "../template/Value.ts";
import {PredicateExpression} from "./PredicateExpression.ts";
import {Expression} from "../template/Expression.ts";

export class IsExpression extends PredicateExpression {
    static equals = text("=");
    static is = text("is");

    private static convert(value: unknown): Expression[] {
        if (value === undefined || value === null) return [IsExpression.is, new Value(null)];
        return [IsExpression.equals, new Value(value)];
    }

    constructor(public readonly value: unknown) {
        super(IsExpression.convert(value));
    }
}

export function is(instance: unknown): IsExpression {
    return new IsExpression(instance);
}