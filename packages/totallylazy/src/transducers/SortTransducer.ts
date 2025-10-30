/** @module Sort elements using a comparator */

import type {Comparator} from "../comparators/Comparator.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface SortTransducer<A> extends Transducer<A, A> {
    readonly comparator: Comparator<A>;
    readonly [Transducer.type]: 'sort';
}

/**
 * Sorts elements using the provided comparator
 */
export function sort<A>(comparator: Comparator<A>): SortTransducer<A> {
    return transducer('sort', function* (iterable: Iterable<A>) {
        const array = Array.from(iterable);
        array.sort(comparator);
        yield* array;
    }, {comparator});
}

export function isSortTransducer(value: any): value is SortTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'sort' && Object.hasOwn(value, 'comparator');
}
