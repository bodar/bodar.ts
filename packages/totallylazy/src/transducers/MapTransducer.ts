/** @module Transducer that maps elements using a function */
import type {Mapper} from "../functions/Mapper.ts";
import {Transducer} from "./Transducer.ts";
import {curry} from "../functions/curry.ts";

/** A transducer that maps the given iterable by the given mapper */
export interface MapTransducer<A, B> extends Transducer<A, B> {
    readonly mapper: Mapper<A, B>;
}

/** A curried map function */
export const map = curry(function* map<A, B>(mapper: Mapper<A, B>, iterable: Iterable<A>): Iterable<B> {
    for (const a of iterable) {
        yield mapper(a);
    }
}) as {
    <A, B>(mapper: Mapper<A, B>, iterable: Iterable<A>): Iterable<B>;
    <A, B>(mapper: Mapper<A, B>): MapTransducer<A, B>;
};

/** Type guard to check if a value is a MapTransducer */
export function isMapTransducer(value: any): value is MapTransducer<any, any> {
    return typeof value === 'function' && value.name === 'map' && value.length === 1 && typeof value.mapper === 'function';
}