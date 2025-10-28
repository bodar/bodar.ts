/** @module Parser that looks ahead without consuming input */
import {success} from "./Success.ts";
import type {Result} from "./Result.ts";
import type {View} from "./View.ts";
import type {Parser} from "./Parser.ts";

/**
 * Parser that looks ahead without consuming input (positive lookahead)
 */
export class PeekParser<A, B> implements Parser<A, B> {
    constructor(private readonly parser: Parser<A, B>) {
    }

    parse(input: View<A>): Result<A, B> {
        const source = input;
        const result = this.parser.parse(input);
        return result instanceof success ? success(result.value, source) : result;
    }
}

/**
 * Creates a parser that looks ahead without consuming input (positive lookahead).
 * Returns the parsed value but doesn't advance the input position.
 *
 * @example
 * ```ts
 * const peekDigit = peek(matches(digit));
 * const result = peekDigit.parse(view("123"));
 * // Success with value "1", but remainder is still "123"
 * ```
 */
export function peek<A, B>(): (parser: Parser<A, B>) => Parser<A, B>;
export function peek<A, B>(parser: Parser<A, B>): Parser<A, B> ;
export function peek<A, B>(parser?: Parser<A, B>): any {
    if (!parser) return peek;
    return new PeekParser(parser);
}