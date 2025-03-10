import type {Predicate} from "./Predicate.ts";
import {alwaysFalse, alwaysTrue} from "../functions/constant.ts";
import {isNotPredicate, not, type NotPredicate} from "./NotPredicate.ts";
import {or} from "./OrPredicate.ts";
import type {ReadonlyArrayContains} from "../collections/Array.ts";

export interface AndPredicate<A> extends Predicate<A> {
    readonly predicates: readonly Predicate<A>[]
}

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

export function isAndPredicate<A = any>(value: any): value is AndPredicate<A> {
    return typeof value === 'function' && value.name === 'and' && Array.isArray(value.predicates);
}