import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {Failure} from "./Failure.ts";
import {success} from "./Success.ts";

/**
 * Parser that sequences multiple parsers, collecting results into an array
 */
export class ListParser<A, T extends any[]> implements Parser<A, T> {
    constructor(private readonly parsers: Parser<A, any>[]) {
    }

    parse(input: View<A>): Result<A, T> {
        const values: any[] = [];
        let result: Result<A, any>;
        for (const parser of this.parsers) {
            result = parser.parse(input);
            if (result instanceof Failure) return result;
            values.push(result.value);
            input = result.remainder;
        }
        return success(values as T, input);
    }
}

type InferInput<P> = P extends Parser<infer A, any> ? A : never;
type InferResult<P> = P extends Parser<any, infer R> ? R : never;

/**
 * Creates a parser that sequences parsers, collecting results into an array
 *
 * @example
 * ```ts
 * const parser = list(string("a"), string("b"));
 * parser.parse(view("ab")); // Success with ["a", "b"]
 * ```
 */
export function list<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, InferResult<P[number]>[]> {
    return new ListParser(parsers);
}

/**
 * Creates a parser that sequences parsers, collecting results into a typed tuple
 *
 * @example
 * ```ts
 * const parser = tuple(string("a"), regex(/\d+/));
 * parser.parse(view("a123")); // Success with ["a", "123"] as [string, string]
 * ```
 */
export function tuple<P extends Parser<any, any>[]>(...parsers: P): Parser<InferInput<P[number]>, { [I in keyof P]: InferResult<P[I]> }> {
    return new ListParser(parsers);
}

/**
 * Creates a parser that sequences two parsers into a pair
 *
 * @example
 * ```ts
 * const parser = pair(string("a"), string("b"));
 * parser.parse(view("ab")); // Success with ["a", "b"]
 * ```
 */
export function pair<A, B, C>(first: Parser<A, B>, second: Parser<A, C>): Parser<A, [B, C]> {
    return tuple(first, second);
}

/**
 * Creates a parser that sequences three parsers into a triple
 *
 * @example
 * ```ts
 * const parser = triple(string("a"), string("b"), string("c"));
 * parser.parse(view("abc")); // Success with ["a", "b", "c"]
 * ```
 */
export function triple<A, B, C, D>(first: Parser<A, B>, second: Parser<A, C>, third: Parser<A, D>): Parser<A, [B, C, D]> {
    return tuple(first, second, third);
}