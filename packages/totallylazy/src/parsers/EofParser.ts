import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {success} from "./Success.ts";
import {fail} from "./Failure.ts";

/**
 * Parser that succeeds only when the input is empty (end of file/input)
 */
export class EofParser<A> implements Parser<A, undefined> {
    parse(input: View<A>): Result<A, undefined> {
        if (input.isEmpty()) return success(undefined, input);
        return fail("[EOF]", input.at(0));
    }
}

/**
 * Creates a parser that succeeds only at the end of input
 *
 * @example
 * ```ts
 * const parser = eof<string>();
 * parser.parse(fromString("")); // Success
 * parser.parse(fromString("a")); // Failure
 * ```
 */
export function eof<A>(): Parser<A, undefined> {
    return new EofParser();
}