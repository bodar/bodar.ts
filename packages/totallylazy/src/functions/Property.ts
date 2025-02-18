import type {Mapper} from "./Mapper.ts";

/**
 * The Property function can be used to extract a value from an object
 */
export interface Property<A, K extends keyof A> extends Mapper<A, A[K]> {
    /**
     * The property key
     */
    readonly key: K
}

/**
 * Creates a Property that extracts the value for the given key from an object
 */
export function property<A, K extends keyof A>(key: K): Property<A, K> {
    return Object.assign(function property(a: A) {
        return a[key];
    }, {
        key,
        toString: () => `property('${String(key)}')`
    })

}

export function isProperty<A = any, B extends keyof A = any>(value: any): value is Property<A, B> {
    return typeof value === 'function' && value.name === 'property' && Object.hasOwn(value, 'key');
}
