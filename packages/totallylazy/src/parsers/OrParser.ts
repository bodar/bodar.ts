import type {Parser} from "./Parser.ts";
import type {Result} from "./Result.ts";
import {fail, Failure} from "./Failure.ts";
import type {View} from "./View.ts";

/**
 * Parser that tries multiple parsers in sequence, succeeding with the first that succeeds
 */
export class OrParser<A, B> implements Parser<A, B> {
    constructor(public readonly parsers: Parser<A, B>[]) {
    }

    parse(segment: View<A>): Result<A, B> {
        for (const parser of this.parsers) {
            const result = parser.parse(segment);
            if (!(result instanceof Failure)) return result;
        }
        return fail(`OrParser failed(${this.parsers})`, segment);
    }
}

/**
 * Creates a parser that tries multiple parsers in sequence, succeeding with the first that succeeds.
 * Also known as choice or alternative parser.
 *
 * @example
 * ```ts
 * const numberOrWord = or(digits, letters);
 * numberOrWord.parse(fromString("123")); // Success with "123"
 * numberOrWord.parse(fromString("abc")); // Success with "abc"
 * ```
 */
export function or<A, B>(second: Parser<A, B>): (parser: Parser<A, B>) => Parser<A, B>;
export function or<A, B>(...parsers: Parser<A, B>[]): Parser<A, B> ;
export function or<A, B>(...parsers: Parser<A, B>[]): any {
    if (parsers.length === 1) return (first: Parser<A, B>) => {
        if (first instanceof OrParser) return new OrParser([...first.parsers, parsers[0]]);
        return new OrParser([first, parsers[0]]);
    };
    return new OrParser(parsers);
}
