import type {Parser} from "./Parser.ts";
import type {Result} from "./Result.ts";
import {fail} from "./Failure.ts";
import {success} from "./Success.ts";
import type {View} from "./View.ts";

export class RegexParser implements Parser<string, string> {
    constructor(private readonly matcher: RegExp) {
    }

    parse(input: View<string>): Result<string, string> {
        const source = String(input.toSource());
        const match = this.matcher[Symbol.match](source);
        if (match === null) return fail(this.matcher, source);
        const [result] = match;
        return success(result, input.slice(result.length));
    }
}

export function regex(matcher: RegExp, fromStart: boolean = true): Parser<string, string> {
    if (fromStart && !matcher.source.startsWith('^')) return new RegexParser(new RegExp(`^${matcher.source}`, matcher.flags))
    return new RegexParser(matcher);
}