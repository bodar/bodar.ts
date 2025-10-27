import {type Parser} from "./Parser.ts";
import {success} from "./Success.ts";
import {fail} from "./Failure.ts";
import {type Result} from "./Result.ts";
import {type View} from "./View.ts";

/**
 * Parser that matches any single element from the input
 */
export class AnyParser<A> implements Parser<A,A>{
    parse(input: View<A>): Result<A, A> {
        if (input.isEmpty()) return fail("Expected any", input);
        return success(input.at(0)!, input.slice(1));
    }
}

/**
 * Creates a parser that matches any single element from the input
 *
 * @example
 * ```ts
 * const parser = any<string>();
 * parser.parse(fromString("abc")); // Success with value "a"
 * ```
 */
export function any<A>(): Parser<A, A> {
    return new AnyParser();
}