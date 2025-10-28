/** @module Predicate that negates another predicate */
import type {Predicate} from "./Predicate.ts";

/** A predicate that negates the given predicate */
export interface NotPredicate<A> extends Predicate<A> {
    readonly predicate: Predicate<A>
}

/** Creates a predicate that negates the given predicate */
export function not<A>(predicate: Predicate<A>): NotPredicate<A> {
    return Object.assign(function not(a: A) {
        return !predicate(a);
    }, {
        predicate,
        toString: () => `not(${predicate})`
    });
}

/** Checks if the given value is a NotPredicate */
export function isNotPredicate<A = any>(value: any): value is NotPredicate<A> {
    return typeof value === 'function' && value.name === 'not' && typeof value.predicate === 'function';
}
