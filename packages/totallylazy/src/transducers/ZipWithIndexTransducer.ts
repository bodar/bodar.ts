/** @module Add index to elements */

import {Transducer, transducer} from "./Transducer.ts";

export interface ZipWithIndexTransducer<A> extends Transducer<A, [A, number]> {
    readonly [Transducer.type]: 'zipWithIndex';
}

/**
 * Adds index to each element, starting from 0
 */
export function zipWithIndex<A>(): ZipWithIndexTransducer<A> {
    return transducer('zipWithIndex', function* (iterable: Iterable<A>): Iterable<[A, number]> {
        let index = 0;
        for (const a of iterable) {
            yield [a, index++] as [A, number];
        }
    }, {});
}

export function isZipWithIndexTransducer(value: any): value is ZipWithIndexTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'zipWithIndex';
}
