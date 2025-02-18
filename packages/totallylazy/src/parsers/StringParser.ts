import {success} from "./Success.ts";
import {fail} from "./Failure.ts";
import type {Result} from "./Result.ts";
import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";

export class StringParser implements Parser<string, string> {
    constructor(private expected: string) {
    }

    parse(input: View<string>): Result<string, string> {
        const other = String(input.slice(0, this.expected.length).toSource());
        if (this.expected !== other) return fail(this.expected, other);
        return success(this.expected, input.slice(this.expected.length));
    }
}

export function string(expected: string): Parser<string, string> {
    return new StringParser(expected);
}