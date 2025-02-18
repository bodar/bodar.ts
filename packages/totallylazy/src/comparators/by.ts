import type {Comparator} from "./Comparator.ts";
import type {Mapper} from "../functions/Mapper.ts";
import {ascending} from "./ascending.ts";
import {property} from "../functions/Property.ts";

/**
 * A comparator that compares two values by first mapping them to a different type
 */
export interface ByComparator<A, B> extends Comparator<A> {
    readonly mapper: Mapper<A, B>;
    readonly comparator: Comparator<B>;
}

/**
 * Creates a ByComparator with the given key/mapper and comparator
 */
export function by<A, K extends keyof A>(key: K, comparator?: Comparator<A[K]>): ByComparator<A, A[K]>;
export function by<A, B>(mapper: Mapper<A, B>, comparator?: Comparator<B>): ByComparator<A, B>;
export function by(mapperOfKey: any, comparator: Comparator<any> = ascending): ByComparator<any, any> {
    const mapper = typeof mapperOfKey === "function" ? mapperOfKey : property<any, any>(mapperOfKey);
    return Object.assign(function by(a: any, b: any) {
        return comparator(mapper(a), mapper(b));
    }, {
        mapper,
        comparator,
        toString: () => `by(${mapper}, ${comparator})`
    });
}

/**
 * Checks if the given value is a ByComparator
 */
export function isByComparator(value: any): value is ByComparator<any, any> {
    return typeof value === 'function' && value.name === 'by' && typeof value.mapper === 'function' && typeof value.comparator === 'function';
}