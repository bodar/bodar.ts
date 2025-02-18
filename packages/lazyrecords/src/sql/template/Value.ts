import {Expression} from "./Expression.ts";

export class Value extends Expression {
    constructor(public readonly value: unknown) {
        super();
    }
}

export function value(value: unknown): Expression {
    if (value instanceof Expression) return value;
    if (value === undefined) return new Value(null);
    return new Value(value);
}
