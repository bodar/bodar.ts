import {zip} from "../transducers/ZipTransducer.ts";

/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 */
export function curry(fn: any): any {
    return new Proxy(fn, new CurryHandler());
}

class CurryHandler<T extends Function> implements ProxyHandler<T> {
    apply(fn: T, self: any, args: any[]): any {
        if (fn.length === args.length) return Reflect.apply(fn, self, args);
        const properties = Object.fromEntries(zip(args)(parametersOf(fn)));
        const newFn = Object.defineProperty(fn.bind(self, ...args), 'name', {value: fn.name, configurable: true});
        return Object.assign(newFn, properties);
    }
}

/**
 * Extract parameter names from a function.
 */
export function parametersOf(fn: any): string[] {
    const args: string = fn.toString().match(/\(([^)]*)\)/)[1];
    return args.split(',').map(arg => arg.trim());
}
