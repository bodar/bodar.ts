import type {Predicate} from "./Predicate.ts";
import type {Comparator} from "../comparators/Comparator.ts";
import {ascending} from "../comparators/ascending.ts";

/**
 * A predicate that checks if the value is between the given values
 */
export interface BetweenPredicate<A> extends Predicate<A> {
    readonly start: A;
    readonly end: A;
}

/**
 * Creates a predicate that checks if the value is between the given values
 */
export function between<A>(start: A, end: A, comparator: Comparator<A> = ascending): BetweenPredicate<A> {
    return Object.assign(function between(value: A) {
        return comparator(value, start) >= 0 && comparator(value, end) <= 0;
    }, {
        start,
        end,
        toString: () => `between(${start}, ${end})`
    });
}

/**
 * Checks if the given value is a BetweenPredicate
 */
export function isBetweenPredicate<A = any>(value: any): value is BetweenPredicate<A> {
    return typeof value === 'function' && value.name === 'between' && Object.hasOwn(value, 'start') && Object.hasOwn(value, 'end');
}
