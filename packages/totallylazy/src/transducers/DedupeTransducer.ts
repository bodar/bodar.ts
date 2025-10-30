/** @module Remove consecutive duplicate elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface DedupeTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'dedupe';
}

/**
 * Removes consecutive duplicate elements
 */
export function dedupe<A>(): DedupeTransducer<A> {
    return transducer('dedupe', function* (iterable: Iterable<A>) {
        let previous: A | undefined;
        let hasPrevious = false;
        for (const a of iterable) {
            if (!hasPrevious || a !== previous) {
                yield a;
                previous = a;
                hasPrevious = true;
            }
        }
    }, {});
}

export function isDedupeTransducer(value: any): value is DedupeTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'dedupe';
}
