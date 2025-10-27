/**
 * A transducer that can be applied synchronously
 */
export interface Transducer<A, B> {
    /**
     * Applies the transducer to the given iterable
     */
    (iterable: Iterable<A>): Iterable<B>;

    /**
     * Returns a string representation of the transducer
     */
    toString(): string;

    readonly [Transducer.type]: string;
}

export class Transducer<A, B> {
    static readonly type = Symbol('Transducer.type');

    static [Symbol.hasInstance](value: any): boolean {
        return typeof value === 'function' && value.length === 1 && Object.hasOwn(value, Transducer.type);
    }
}

/**
 * Creates a custom transducer with the given name, implementation, and properties
 *
 * @param name - The name of the transducer type (e.g., 'map', 'filter')
 * @param target - The generator function that implements the transducer logic
 * @param source - Additional properties to attach to the transducer (e.g., mapper, predicate)
 * @returns A transducer instance with the specified name, implementation, and properties
 *
 * @example
 * ```typescript
 * const doubleMap = transducer('double', function* (iterable: Iterable<number>) {
 *   for (const n of iterable) yield n * 2;
 * }, {});
 * Array.from(doubleMap([1, 2, 3])); // [2, 4, 6]
 * ```
 */
export function transducer<N extends string, T extends (iterable: Iterable<any>) => Iterable<any>, U extends object>(name: N, target: T, source: U): {[Transducer.type]: N} & T & U {
    return Object.assign(target, {
        [Transducer.type]: name,
        toString: () => {
            const values = Object.values(source);
            const valuesStr = values.map(v => typeof v === 'function' ? v.toString().replace(/^\((.*?)\)/, '$1') : v).join(', ');
            return `${name}(${valuesStr})`;
        }
    }, source);
}
