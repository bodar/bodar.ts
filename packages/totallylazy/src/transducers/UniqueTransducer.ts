/** @module Remove all duplicate elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface UniqueTransducer<A> extends Transducer<A, A> {
    readonly [Transducer.type]: 'unique';
}

/**
 * Removes all duplicate elements using Set
 */
export function unique<A>(): UniqueTransducer<A> {
    return transducer('unique', function* (iterable: Iterable<A>) {
        const seen = new Set<A>();
        for (const a of iterable) {
            if (!seen.has(a)) {
                seen.add(a);
                yield a;
            }
        }
    }, {});
}

export function isUniqueTransducer(value: any): value is UniqueTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'unique';
}
