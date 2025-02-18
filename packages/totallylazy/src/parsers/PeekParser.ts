import {success} from "./Success.ts";
import type {Result} from "./Result.ts";
import type {View} from "./View.ts";
import type {Parser} from "./Parser.ts";

export class PeekParser<A, B> implements Parser<A, B> {
    constructor(private readonly parser: Parser<A, B>) {
    }

    parse(input: View<A>): Result<A, B> {
        const source = input;
        const result = this.parser.parse(input);
        return result instanceof success ? success(result.value, source) : result;
    }
}

export function peek<A, B>(): (parser: Parser<A, B>) => Parser<A, B>;
export function peek<A, B>(parser: Parser<A, B>): Parser<A, B> ;
export function peek<A, B>(parser?: Parser<A, B>): any {
    if (!parser) return peek;
    return new PeekParser(parser);
}