import type {Parser} from "./Parser.ts";
import type {View} from "./View.ts";
import type {Result} from "./Result.ts";
import {success} from "./Success.ts";
import {fail} from "./Failure.ts";

export class EofParser<A> implements Parser<A, undefined> {
    parse(input: View<A>): Result<A, undefined> {
        if (input.isEmpty()) return success(undefined, input);
        return fail("[EOF]", input.at(0));
    }
}

export function eof<A>(): Parser<A, undefined> {
    return new EofParser();
}