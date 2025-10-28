/** @module Parser that succeeds when another parser fails */
import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {Success, success} from "./Success.ts";
import {fail} from "./Failure.ts";

/**
 * Parser that succeeds only when the wrapped parser fails (negative lookahead)
 */
export class NotParser<A> implements Parser<A, undefined> {
    constructor(private readonly parser: Parser<A, any>) {
    }

    parse(input: View<A>): Result<A, undefined> {
        const result = this.parser.parse(input);
        return result instanceof Success ? fail('Not(' + this.parser + ')', result.value) : success(undefined, input);
    }
}

/**
 * Creates a parser that succeeds when the given parser fails (negative lookahead).
 * Does not consume input on success.
 *
 * @example
 * ```ts
 * const notDigit = not(matches(digit));
 * notDigit.parse(view("a")); // Success
 * notDigit.parse(view("1")); // Failure
 * ```
 */
export function not<A>(): (parser: Parser<A, any>) => Parser<A, undefined>;
export function not<A>(parser: Parser<A, any>): Parser<A, undefined>;
export function not<A>(parser?: Parser<A, any>): any {
    if (!parser) return not;
    return new NotParser(parser);
}