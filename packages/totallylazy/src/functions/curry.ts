/** @module Functions to support currying functions */

import {Parameter, parametersOf} from "./parameters.ts";

/**
 * Placeholder symbol to allow calling curried functions in any order.
 * Can be used in place of any argument type.
 */
export const _ = Symbol('curry.placeholderSymbol');

/**
 * Type representing the placeholder symbol.
 * Can be used wherever a parameter would be.
 */
export type Placeholder = typeof _;

// Type utilities for currying with progressive type refinement

/**
 * Curried function type with 1 parameter
 */
export type Curried1<P1, R> =
    & ((...args: [P1 | Placeholder]) => R)
    & { readonly [K: string]: any }; // Allow dynamic property access for parameter names

/**
 * Curried function type with 2 parameters
 */
export type Curried2<P1, P2, R> =
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder) => R)
    & ((arg1: P1 | Placeholder) => Curried1<P2, R>)
    & { readonly [K: string]: any };

/**
 * Curried function type with 3 parameters
 */
export type Curried3<P1, P2, P3, R> =
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder, arg3: P3 | Placeholder) => R)
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder) => Curried1<P3, R>)
    & ((arg1: P1 | Placeholder) => Curried2<P2, P3, R>)
    & { readonly [K: string]: any };

/**
 * Curried function type with 4 parameters
 */
export type Curried4<P1, P2, P3, P4, R> =
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder, arg3: P3 | Placeholder, arg4: P4 | Placeholder) => R)
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder, arg3: P3 | Placeholder) => Curried1<P4, R>)
    & ((arg1: P1 | Placeholder, arg2: P2 | Placeholder) => Curried2<P3, P4, R>)
    & ((arg1: P1 | Placeholder) => Curried3<P2, P3, P4, R>)
    & { readonly [K: string]: any };

/**
 * Main Curried type that dispatches to the appropriate arity-specific type
 */
export type Curried<F extends (...args: any[]) => any> =
    F extends (a: infer P1, b: infer P2, c: infer P3, d: infer P4, ...rest: infer Rest) => infer R
        ? Rest['length'] extends 0
            ? Curried4<P1, P2, P3, P4, R>
            : ((...args: Parameters<F>) => R) & { readonly [K: string]: any } // 5+ params, fallback
        : F extends (a: infer P1, b: infer P2, c: infer P3) => infer R
        ? Curried3<P1, P2, P3, R>
        : F extends (a: infer P1, b: infer P2) => infer R
        ? Curried2<P1, P2, R>
        : F extends (a: infer P1) => infer R
        ? Curried1<P1, R>
        : F extends () => infer R
        ? (() => R)
        : never;

/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 * Can optionally be used to bind the supplied parameters onto the function
 */
export function curry<F extends (...args: any[]) => any>(fn: F, appliedParameters: object = {}): Curried<F> {
    return create(fn, appliedParameters, parametersOf(fn)) as Curried<F>;
}

function create(fn: any, appliedParameters: object, parametersSignature: Parameter[]) {
    return new Proxy(fn, new CurryHandler(appliedParameters, parametersSignature));
}

class CurryHandler<T extends Function> implements ProxyHandler<T> {
    constructor(private readonly appliedParameters: object, private readonly parametersSignature: Parameter[]) {
    }

    apply(fn: T, self: any, args: any[]): any {
        const allParameters = this.allParameters(args);
        if (this.parametersSignature.length === Object.keys(allParameters).length) return Reflect.apply(fn, self, Object.values(allParameters));
        return create(fn, allParameters, this.parametersSignature);
    }

    private allParameters(args: any[] = []) {
        return this.parametersSignature.reduce((properties, parameter) => {
            if (Object.hasOwn(this.appliedParameters, parameter.name)) {
                const value = Reflect.get(this.appliedParameters, parameter.name);
                if (!(parameter.hasDefault && typeof value === 'undefined')) {
                    Reflect.set(properties, parameter.name, value);
                    return properties;
                }
            }
            if (args.length > 0) {
                const arg = args.shift();
                if (arg !== _) Reflect.set(properties, parameter.name, arg);
            } else if (parameter.hasDefault) Reflect.set(properties, parameter.name, undefined);
            return properties;
        }, {});
    }

    get(fn: T, p: string | symbol, _receiver: any): any {
        if (p === 'toString') {
            if (fn.name) return () => `${fn.name}(${Object.values(this.allParameters()).join(', ')})`;
            else return () => fn.toString();
        }
        if(p === 'length') return this.parametersSignature.length - Object.keys(this.allParameters()).length;
        if (p in fn) return Reflect.get(fn, p);
        return Reflect.get(this.appliedParameters, p);
    }

    has(fn: T, p: string | symbol): boolean {
        return p in fn || Object.hasOwn(this.appliedParameters, p);
    }
}
