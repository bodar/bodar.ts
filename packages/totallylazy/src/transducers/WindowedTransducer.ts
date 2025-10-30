/** @module Sliding window with configurable size and step */

import {Transducer, transducer} from "./Transducer.ts";

export interface WindowedTransducer<A> extends Transducer<A, A[]> {
    readonly size: number;
    readonly step: number;
    readonly remainder: boolean;
    readonly [Transducer.type]: 'windowed';
}

/**
 * Creates sliding windows of elements with specified size and step
 * @param size Window size
 * @param step Step between windows (default 1)
 * @param remainder Whether to yield incomplete final window (default false)
 */
export function windowed<A>(size: number, step: number = 1, remainder: boolean = false): WindowedTransducer<A> {
    return transducer('windowed', function* (iterable: Iterable<A>) {
        let buffer: A[] = [];
        let skip = 0;
        for (const current of iterable) {
            if (skip > 0) {
                skip--;
                continue;
            }
            buffer.push(current);
            if (buffer.length === size) {
                yield [...buffer];
                buffer = buffer.slice(step);
                if (step > size) skip = step - size;
            }
        }
        if (remainder && buffer.length > 0) yield [...buffer];
    }, {size, step, remainder});
}

export function isWindowedTransducer(value: any): value is WindowedTransducer<any> {
    return value instanceof Transducer && value[Transducer.type] === 'windowed' &&
           Object.hasOwn(value, 'size') && Object.hasOwn(value, 'step') && Object.hasOwn(value, 'remainder');
}
