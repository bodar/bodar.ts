import type {Predicate} from "./Predicate.ts";
import {alwaysFalse, alwaysTrue} from "../functions/constant.ts";
import {isNotPredicate, not, type NotPredicate} from "./NotPredicate.ts";
import {or} from "./OrPredicate.ts";
import type {ReadonlyArrayContains} from "../collections/Array.ts";

/**
 * A predicate that returns true only if all supplied predicates return true
 */
export interface AndPredicate<A> extends Predicate<A> {
    /**
     * The predicates to check
     */
    readonly predicates: readonly Predicate<A>[]
}

/**
 * Creates a predicate that returns true only if all supplied predicates return true.
 * Automatically optimizes by removing redundant predicates and applying De Morgan's law.
 *
 * @example
 * ```ts
 * const even = (x: number) => x % 2 === 0;
 * const positive = (x: number) => x > 0;
 * const predicate = and(even, positive);
 * predicate(2); // true
 * predicate(-2); // false
 * ```
 */
export function and<A>(): typeof alwaysTrue;
export function and<P extends Predicate<any>>(predicate: P): P;
export function and<A>(...predicates: readonly NotPredicate<A>[]): NotPredicate<A>;
export function and<A>(...predicates: ReadonlyArrayContains<Predicate<A>, typeof alwaysFalse>): typeof alwaysFalse;
export function and<A>(...predicates: readonly Predicate<A>[]): AndPredicate<A>;
export function and<A>(...original: readonly Predicate<A>[]): Predicate<A> {
    const predicates = original
        .flatMap(p => isAndPredicate(p) ? p.predicates : [p])
        .filter(p => p !== alwaysTrue);
    if (predicates.length === 0) return alwaysTrue;
    if (predicates.length === 1) return predicates[0];
    if (predicates.some(p => p === alwaysFalse)) return alwaysFalse;
    if (predicates.every(isNotPredicate)) return not(or(...predicates.map(p => p.predicate)));
    return Object.assign(function and(a: A) {
        return predicates.every(p => p(a));
    }, {
        predicates,
        toString: () => `and(${predicates.join(', ')})`
    });
}

/**
 * Checks if the given value is an AndPredicate
 */
export function isAndPredicate<A = any>(value: any): value is AndPredicate<A> {
    return typeof value === 'function' && value.name === 'and' && Array.isArray(value.predicates);
}