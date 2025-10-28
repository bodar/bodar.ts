/** @module Parser that repeats another parser a specified number of times */
import type {Parser} from "./Parser.ts";
import type {Result} from "./Result.ts";
import {fail, Failure} from "./Failure.ts";
import {success} from "./Success.ts";
import type {View} from "./View.ts";

/**
 * Parser that repeats a parser between min and max times
 */
export class RepeatParser<A, B> implements Parser<A, B[]> {
    constructor(
        private parser: Parser<A, B>,
        private min: number = Number.POSITIVE_INFINITY,
        private max: number = Number.POSITIVE_INFINITY
    ) {}

    parse(input: View<A>): Result<A, B[]> {
        const results: B[] = [];
        let count = 0;

        while (count < this.max) {
            const result = this.parser.parse(input);
            if (result instanceof Failure) break;

            results.push(result.value);
            input = result.remainder;
            count++;
        }

        if (count < this.min) {
            return fail(`Expected at least ${this.min}, got ${count}`, input);
        }

        return success(results, input);
    }
}

/**
 * Creates a parser that repeats a parser between min and max times.
 * Equivalent to the `{min,max}` operator in regular expressions.
 *
 * @example
 * ```ts
 * const threeDigits = repeat(3, 3, matches(digit));
 * threeDigits.parse(view("123")); // Success with ["1", "2", "3"]
 * threeDigits.parse(view("12")); // Failure (too few)
 * ```
 */
export function repeat<A, B>(): (parser: Parser<A, B>) => Parser<A, B[]>;
export function repeat<A, B>(min: number): (parser: Parser<A, B>) => Parser<A, B[]>;
export function repeat<A, B>(min: number, max: number): (parser: Parser<A, B>) => Parser<A, B[]>;
export function repeat<A, B>(min: number, max: number, parser: Parser<A, B>): Parser<A, B[]>;
export function repeat<A, B>(min?: number, max?: number, parser?: Parser<A, B>): any {
    if (!parser) return (p: Parser<A, B>) => new RepeatParser(p, min, max);
    return new RepeatParser(parser, min, max);
}
