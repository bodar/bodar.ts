/** @module Reduce sequence to a single value */

import type {Reducer} from "../functions/Reducer.ts";
import {Transducer, transducer} from "./Transducer.ts";

export interface ReduceTransducer<A, B> extends Transducer<A, B> {
    readonly reducer: Reducer<A, B>;
    readonly seed: B;
    readonly [Transducer.type]: 'reduce';
}

/**
 * Reduces sequence to a single value using a reducer and seed
 */
export function reduce<A, B>(reducer: Reducer<A, B>, seed: B): ReduceTransducer<A, B> {
    return transducer('reduce', function* (iterable: Iterable<A>) {
        let accumulator = seed;
        for (const a of iterable) {
            accumulator = reducer(accumulator, a);
        }
        yield accumulator;
    }, {reducer, seed});
}

export function isReduceTransducer(value: any): value is ReduceTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'reduce' && Object.hasOwn(value, 'reducer') && Object.hasOwn(value, 'seed');
}
