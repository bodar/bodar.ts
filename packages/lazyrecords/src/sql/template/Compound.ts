/**
 * @module
 *
 * SQL compound expressions for combining multiple expressions with separators (AND, OR, BETWEEN, etc.).
 */

import {Expression} from "./Expression.ts";
import {empty, space, text, Text} from "./Text.ts";
import {id, Identifier} from "./Identifier.ts";
import {value, Value} from "./Value.ts";

/** Represents a compound SQL expression combining multiple sub-expressions with separators. */
export class Compound extends Expression implements Iterable<Text | Identifier | Value> {
    constructor(public readonly expressions: readonly Expression[],
                public separator: Text = space,
                public start: Text = empty,
                public end: Text = start) {
        super();
    }

    * [Symbol.iterator](): Iterator<Text | Identifier | Value> {
        if (this.start !== empty) yield this.start;
        let first = true;
        for (const expression of this.expressions) {
            if (first) {
                first = false;
            } else {
                if (this.separator !== empty) yield this.separator;
            }
            if (expression instanceof Text) yield expression;
            if (expression instanceof Identifier) yield expression;
            if (expression instanceof Value) yield expression;
            if (expression instanceof Compound) yield* expression;
        }
        if (this.end !== empty) yield this.end;
    }
}

/** Creates a compound expression from multiple expressions with space separator. */
export function expression(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions);
}

/** Creates a comma-separated list of expressions. */
export function list(expressions: readonly Expression[], separator: Text = text(', ')): Compound {
    return new Compound(expressions, separator);
}

/** Creates a comma-separated list of identifiers from strings. */
export function ids(identifiers: readonly string[]): Compound {
    return list(identifiers.map(id));
}


/** Creates a comma-separated list of SQL values. */
export function values(values: unknown[]): Compound {
    return list(values.map(value));
}

/** Alias for values() function. */
export const spread = values;

/** Creates an AND compound expression with parentheses. */
export function and(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions, text(' and '), text('('), text(')'));
}

/** Creates an OR compound expression with parentheses. */
export function or(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions, text(' or '), text('('), text(')'));
}

/** Creates a NOT compound expression wrapping the given expression. */
export function not(original: Expression): Compound {
    return expression(text('not'), text('('), original, text(')'));
}

/** Creates a BETWEEN compound expression for range conditions. */
export function between(start: unknown, end: unknown): Compound {
    return expression(text('between'), value(start), text('and'), value(end));
}



