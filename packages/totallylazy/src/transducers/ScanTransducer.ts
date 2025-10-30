/** @module Accumulating map that emits intermediate values */

import type {Reducer} from "../functions/Reducer.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface ScanTransducer<A, B> extends Transducer<A, B> {
    readonly reducer: Reducer<A, B>;
    readonly seed: B;
    readonly [Transducer.type]: 'scan';
}

/**
 * Accumulates values using a reducer, yielding intermediate results including the seed
 */
export function scan<A, B>(reducer: Reducer<A, B>, seed: B): ScanTransducer<A, B> {
    return transducer('scan', function* (iterable: Iterable<A>) {
        let accumulator = seed;
        yield accumulator;
        for (const a of iterable) {
            yield accumulator = reducer(accumulator, a);
        }
    }, {reducer, seed});
}

export function isScanTransducer(value: any): value is ScanTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'scan' && Object.hasOwn(value, 'reducer') && Object.hasOwn(value, 'seed');
}
