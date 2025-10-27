import type {Mapper} from "../functions/Mapper.ts";
import {transducer, Transducer} from "./Transducer.ts";

/** A transducer that flat map the given iterable by the given mapper */
export interface FlatMapTransducer<A, B> extends Transducer<A, B> {
    readonly mapper: Mapper<A, Iterable<B>>;

    readonly [Transducer.type]: 'flatMap';
}

/** Creates a transducer that flat maps the given iterable by the given mapper */
export function flatMap<A, B>(mapper: Mapper<A, Iterable<B>>): FlatMapTransducer<A, B> {
    return transducer('flatMap', function* (iterable: Iterable<A>) {
        for (const a of iterable) {
            yield* mapper(a);
        }
    }, {mapper});
}

/** Type guard to check if a value is a FlatMapTransducer */
export function isFlatMapTransducer(value: any): value is FlatMapTransducer<any, any> {
    return value instanceof Transducer && value[Transducer.type] === 'flatMap' && Object.hasOwn(value, 'mapper');
}