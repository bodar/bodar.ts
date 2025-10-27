import {not} from "../predicates/NotPredicate.ts";
import type {Predicate} from "../predicates/Predicate.ts";
import {transducer, Transducer} from "./Transducer.ts";

/**
 * A transducer that filters the given iterable by the given predicate
 */
export interface FilterTransducer<A> extends Transducer<A, A> {
    /**
     * The predicate to filter by
     */
    readonly predicate: Predicate<A>;

    /** Type identifier for filter transducers */
    readonly [Transducer.type]: 'filter';
}

/**
 * Creates a transducer that filters the given iterable by the given predicate
 */
export function filter<A>(predicate: Predicate<A>): FilterTransducer<A> {
    return transducer('filter', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            if (predicate(a)) yield a;
        }
    }, {predicate});
}

/**
 * Alias for filter (inspired by ruby)
 */
export const accept = filter;

/**
 * Alias for not filter  (inspired by ruby)
 */
export function reject<A>(predicate: Predicate<A>): FilterTransducer<A> {
    return filter(not(predicate));
}

/**
 * Type guard to check if a value is a FilterTransducer
 *
 * @example
 * ```typescript
 * const evenFilter = filter((x: number) => x % 2 === 0);
 * isFilterTransducer(evenFilter); // true
 * isFilterTransducer(() => false); // false
 * ```
 */
export function isFilterTransducer(value: any): value is FilterTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'filter' && Object.hasOwn(value, 'predicate');
}