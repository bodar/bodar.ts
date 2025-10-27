import type {Predicate} from "./Predicate.ts";
import {and} from "./AndPredicate.ts";
import {or} from "./OrPredicate.ts";
import {not} from "./NotPredicate.ts";

/**
 * A predicate with fluent methods for logical operations (and, or, not)
 */
export interface LogicalPredicate<A> extends Predicate<A> {
    and(predicate: Predicate<A>): LogicalPredicate<A>;

    or(predicate: Predicate<A>): LogicalPredicate<A>;

    not(): LogicalPredicate<A>;
}

/**
 * Wraps a predicate with fluent methods for logical operations
 *
 * @example
 * ```ts
 * const even = (x: number) => x % 2 === 0;
 * const positive = (x: number) => x > 0;
 * const predicate = logical(even).and(positive);
 * predicate(2); // true
 * ```
 */
export function logical<A>(predicate: Predicate<A>): LogicalPredicate<A> {
    return Object.assign(predicate, {
        and: (other: Predicate<A>) => logical(and(predicate, other)),
        or: (other: Predicate<A>) => logical(or(predicate, other)),
        not: () => logical(not(predicate)),
    });
}