import type {Mapper} from "../functions/Mapper.ts";
import {Transducer, transducer} from "./Transducer.ts";

/**
 * A transducer that maps the given iterable by the given mapper
 */
export interface MapTransducer<A, B> extends Transducer<A, B> {
    /**
     * The mapper to map by
     */
    readonly mapper: Mapper<A, B>;

    readonly [Transducer.type]: 'map';
}

/**
 * Creates a transducer that maps the given iterable by the given mapper
 */
export function map<A, B>(mapper: Mapper<A, B>): MapTransducer<A, B> {
    return transducer('map', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            yield mapper(a);
        }
    }, {mapper});
}

export function isMapTransducer(value: any): value is MapTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'map' && Object.hasOwn(value, 'mapper');
}