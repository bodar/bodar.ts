import type {Predicate} from "../predicates/Predicate.ts";
import type {Parser} from "./Parser.ts";
import type {Result} from "./Result.ts";
import {success} from "./Success.ts";
import {fail} from "./Failure.ts";
import type {View} from "./View.ts";

/**
 * Parser that matches a single element satisfying a predicate.
 * For matching multiple elements, combine with many(), times(n), etc.
 */
export class PredicateParser<A> implements Parser<A, A> {
    constructor(private predicate: Predicate<A>) {
    }

    parse(input: View<A>): Result<A, A> {
        if (input.isEmpty()) return fail(this.predicate, "[EOF]");
        const a = input.at(0);
        if (!(a && this.predicate(a))) return fail(this.predicate, a);
        return success(a, input.slice(1));
    }
}

export function matches<A>(predicate: Predicate<A>): Parser<A, A> {
    return new PredicateParser(predicate);
}