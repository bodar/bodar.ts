import type {Predicate} from "./Predicate.ts";
import {and} from "./AndPredicate.ts";
import {or} from "./OrPredicate.ts";
import {not} from "./NotPredicate.ts";

export interface LogicalPredicate<A> extends Predicate<A> {
    and(predicate: Predicate<A>): LogicalPredicate<A>;

    or(predicate: Predicate<A>): LogicalPredicate<A>;

    not(): LogicalPredicate<A>;
}

export function logical<A>(predicate: Predicate<A>): LogicalPredicate<A> {
    return Object.assign(predicate, {
        and: (other: Predicate<A>) => logical(and(predicate, other)),
        or: (other: Predicate<A>) => logical(or(predicate, other)),
        not: () => logical(not(predicate)),
    });
}