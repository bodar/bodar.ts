import type {Predicate} from "./Predicate.ts";
import {alwaysFalse, alwaysTrue} from "../functions/constant.ts";
import {isNotPredicate, not, type NotPredicate} from "./NotPredicate.ts";
import type {ReadonlyArrayContains} from "../collections/Array.ts";
import {and} from "./AndPredicate.ts";

export interface OrPredicate<A> extends Predicate<A> {
    readonly predicates: readonly Predicate<A>[]
}

export function or<A>(): typeof alwaysTrue;
export function or<P extends Predicate<any>>(predicate: P): P;
export function or<A>(...predicates: readonly NotPredicate<A>[]): NotPredicate<A>;
export function or<A>(...predicates: ReadonlyArrayContains<Predicate<A>, typeof alwaysTrue>): typeof alwaysTrue;
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

export function isOrPredicate<A = any>(value: any): value is OrPredicate<A> {
    return typeof value === 'function' && value.name === 'or' && Array.isArray(value.predicates);
}