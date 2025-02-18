import {text, Text} from "./Text.ts";
import {value, Value} from "./Value.ts";
import {Identifier} from "./Identifier.ts";
import {escapeIdentifier, escapeLiteral} from "../ansi/escape.ts";
import {Expression} from "./Expression.ts";
import {Compound} from "./Compound.ts";

/**
 * A Sql expression.
 */
export class Sql extends Compound implements Iterable<Text | Identifier | Value> {
    constructor(readonly expressions: readonly Expression[]) {
        super(expressions, text(""));
    }

    generate(handler: (expression: (Identifier | Value)) => string): string {
        return Array.from(this).map(e => {
            if (e instanceof Text) return e.text;
            if (e instanceof Identifier || e instanceof Value) return handler(e);
        }).join('');
    }

    values(): unknown[] {
        return Array.from(this).flatMap(e => e instanceof Value ? [e.value] : []);
    }

    toString(): string {
        return this.generate(e => {
            if (e instanceof Identifier) return escapeIdentifier(e.identifier);
            if (e instanceof Value) return typeof e.value === 'string' ? escapeLiteral(e.value) : String(e.value);
            return '';
        });
    }
}

/**
 * Create a Sql expression from a number of expressions.
 */
export function sql(...expressions: readonly Expression[]): Sql {
    return new Sql(expressions);
}

/**
 * Create a SQL expression from a template string.
 */
export function SQL(chunks: TemplateStringsArray, ...values: readonly unknown[]): Sql {
    return sql(...(function* () {
        let index = 0;
        for (const chunk of chunks) {
            if (chunk !== '') yield text(chunk);
            if (index < values.length) yield value(values[index]);
            index++;
        }
    })());
}
