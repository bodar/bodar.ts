import {Expression} from "./Expression.ts";
import {empty, space, text, Text} from "./Text.ts";
import {id, Identifier} from "./Identifier.ts";
import {value, Value} from "./Value.ts";

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

/**
 * Create a Compound from an array of Expressions.
 */
export function expression(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions);
}

/**
 * Create a Compound list from an array of Expressions.
 */
export function list(expressions: readonly Expression[], separator = text(', ')): Compound {
    return new Compound(expressions, separator);
}

/**
 * Create multiple Identifiers from an array of strings.
 *
 * With optional separator. Defaults to ', '.
 */
export function ids(identifiers: readonly string[]): Compound {
    return list(identifiers.map(id));
}


export function values(values: unknown[]): Compound {
    return list(values.map(value));
}

export const spread = values;


export function and(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions, text(' and '), text('('), text(')'));
}

export function or(...expressions: readonly Expression[]): Compound {
    return new Compound(expressions, text(' or '), text('('), text(')'));
}

export function not(original: Expression): Compound {
    return expression(text('not'), text('('), original, text(')'));
}

export function between(start: unknown, end: unknown): Compound {
    return expression(text('between'), value(start), text('and'), value(end));
}



