/** A transducer that can be applied synchronously */
export interface Transducer<A, B> {
    (iterable: Iterable<A>): Iterable<B>;

    toString(): string;

    readonly [Transducer.type]: string;
}

export class Transducer<A, B> {
    static readonly type = Symbol('Transducer.type');

    static [Symbol.hasInstance](value: any): boolean {
        return typeof value === 'function' && value.length === 1 && Object.hasOwn(value, Transducer.type);
    }
}

/** Creates a custom transducer with the given name, implementation, and properties */
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
