/** @module Predicate that combines predicates with logical OR */
import type {Predicate} from "./Predicate.ts";
import {alwaysFalse, alwaysTrue} from "../functions/constant.ts";
import {isNotPredicate, not, type NotPredicate} from "./NotPredicate.ts";
import type {ReadonlyArrayContains} from "../collections/Array.ts";
import {and} from "./AndPredicate.ts";

/** A predicate that returns true if any of the supplied predicates returns true */
export interface OrPredicate<A> extends Predicate<A> {
    readonly predicates: readonly Predicate<A>[]
}

/** Creates a predicate that returns true if any of the supplied predicates returns true. */
export function or(): typeof alwaysTrue;
/** Creates a predicate that returns true if any of the supplied predicates returns true. */
export function or<P extends Predicate<any>>(predicate: P): P;
/** Creates a predicate that returns true if any of the supplied predicates returns true. */
export function or<A>(...predicates: readonly NotPredicate<A>[]): NotPredicate<A>;
/** Creates a predicate that returns true if any of the supplied predicates returns true. */
export function or<A>(...predicates: ReadonlyArrayContains<Predicate<A>, typeof alwaysTrue>): typeof alwaysTrue;
/** Creates a predicate that returns true if any of the supplied predicates returns true. */
export function or<A>(...predicates: readonly Predicate<A>[]): OrPredicate<A>;
export function or<A>(...original: readonly Predicate<A>[]): Predicate<A> {
    const predicates = original
        .flatMap(p => isOrPredicate(p) ? p.predicates : [p])
        .filter(p => p !== alwaysFalse);
    if (predicates.some(p => p === alwaysTrue)) return alwaysTrue;
    if (predicates.length === 0) return alwaysFalse;
    if (predicates.length === 1) return predicates[0];
    if (predicates.every(isNotPredicate)) return not(and(...predicates.map(p => p.predicate)));
    return Object.assign(function or(a: A) {
        return predicates.some(p => p(a));
    }, {
        predicates,
        toString: () => `or(${predicates.join(', ')})`
    });
}

/**
 * Checks if the given value is an OrPredicate
 */
export function isOrPredicate<A = any>(value: any): value is OrPredicate<A> {
    return typeof value === 'function' && value.name === 'or' && Array.isArray(value.predicates);
}