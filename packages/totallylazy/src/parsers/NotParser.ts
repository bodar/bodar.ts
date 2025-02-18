import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {Success, success} from "./Success.ts";
import {fail} from "./Failure.ts";

export class NotParser<A> implements Parser<A, undefined> {
    constructor(private readonly parser: Parser<A, any>) {
    }

    parse(input: View<A>): Result<A, undefined> {
        const result = this.parser.parse(input);
        return result instanceof Success ? fail('Not(' + this.parser + ')', result.value) : success(undefined, input);
    }
}

export function not<A>(): (parser: Parser<A, any>) => Parser<A, undefined>;
export function not<A>(parser: Parser<A, any>): Parser<A, undefined>;
export function not<A>(parser?: Parser<A, any>): any {
    if (!parser) return not;
    return new NotParser(parser);
}