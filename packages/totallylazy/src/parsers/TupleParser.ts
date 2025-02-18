import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {Failure} from "./Failure.ts";
import {success} from "./Success.ts";

export class TupleParser<A, T extends any[]> implements Parser<A, T> {
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

type ParserResult<P> = P extends Parser<any, infer R> ? R : never;
type TupleResult<P extends Parser<any, any>[]> = { [I in keyof P]: ParserResult<P[I]> };

export function tuple<A, P extends Parser<A, any>[]>(...parsers: P): Parser<A, TupleResult<P>> {
    return new TupleParser(parsers);
}

export function pair<A, B, C>(first: Parser<A, B>, second: Parser<A, C>): Parser<A, [B, C]> {
    return tuple(first, second);
}

export function triple<A, B, C, D>(first: Parser<A, B>, second: Parser<A, C>, third: Parser<A, D>): Parser<A, [B, C, D]> {
    return tuple(first, second, third);
}