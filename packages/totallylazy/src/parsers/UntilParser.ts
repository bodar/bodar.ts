import type {Parser} from "./Parser.ts";
import type {Result} from "./Result.ts";
import {Success, success} from "./Success.ts";
import {Failure} from "./Failure.ts";
import type {View} from "./View.ts";

export class UntilParser<A, B> implements Parser<A, B[]> {
    constructor(private step: Parser<A, B>, private stop: Parser<A, any>) {
    }

    parse(input: View<A>): Result<A, B[]> {
        const list: B[] = [];

        while (!input.isEmpty()) {
            if (this.stop.parse(input) instanceof Success) break;
            const result = this.step.parse(input);
            if (result instanceof Failure) break;
            list.push(result.value);
            input = result.remainder;
        }
        return success(list, input);
    }
}

export function until<A, B>(stop: Parser<A, any>): (step: Parser<A, B>) => Parser<A, B[]> {
    return (step: Parser<A, B>) => new UntilParser(step, stop);
}