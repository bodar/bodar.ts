/** @module Skip first N elements from a sequence */

import {Transducer, transducer} from "./Transducer.ts";

export interface DropTransducer<A> extends Transducer<A, A> {
    readonly count: number;
    readonly [Transducer.type]: 'drop';
}

/**
 * Skips first count elements
 */
export function drop<A>(count: number): DropTransducer<A> {
    return transducer('drop', function* (iterable: Iterable<A>) {
        let dropped = 0;
        for (const a of iterable) {
            if (dropped++ >= count) yield a;
        }
    }, {count});
}

export function isDropTransducer(value: any): value is DropTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'drop' && Object.hasOwn(value, 'count');
}
