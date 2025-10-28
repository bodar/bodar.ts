/**
 * @module
 *
 * SQL value placeholders for parameterized queries and safe value interpolation.
 */

import {Expression} from "./Expression.ts";

/** Represents a SQL value placeholder for parameterized queries. */
export class Value extends Expression {
    constructor(public readonly value: unknown) {
        super();
    }
}

/** Creates a SQL value expression, converting undefined to null and passing through existing expressions. */
export function value(value: unknown): Expression {
    if (value instanceof Expression) return value;
    if (value === undefined) return new Value(null);
    return new Value(value);
}
