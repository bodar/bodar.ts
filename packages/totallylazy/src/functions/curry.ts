/** @module Functions to support currying functions */

import {Parameter, parametersOf} from "./parameters.ts";

/**
 * Placeholder symbol to allow calling curried functions in any order.
 * Can be used in place of any argument type.
 */
export const _ = Symbol('curry.placeholderSymbol');

type Fn = (...args: any[]) => any;

export type Placeholder = typeof _;

export type AllowPlaceholder<T extends any[]> = {
    [K in keyof T]: T[K] | Placeholder;
};

export type RequiredFirstParam<F extends Fn> =
    Parameters<F> extends [infer Head, ...infer Tail]
        ? [Head | Placeholder, ...Partial<AllowPlaceholder<Tail>>]
        : [];

export type RemainingParameters<AppliedParams extends any[], ExpectedParams extends any[]> =
    AppliedParams extends [infer AHead, ...infer ATail]
        ? ExpectedParams extends [infer EHead, ...infer ETail]
            ? AHead extends Placeholder
                ? [EHead, ...RemainingParameters<ATail, ETail>]
                : RemainingParameters<ATail, ETail>
            : []
        : ExpectedParams;

export type Curried<F extends Fn, Accumulated extends any[] = []> =
    <AppliedParams extends RequiredFirstParam<F>>(...args: AppliedParams) =>
        RemainingParameters<AppliedParams, Parameters<F>> extends [any, ...any[]]
            ? (Curried<(...args: RemainingParameters<AppliedParams, Parameters<F>>) => ReturnType<F>, [...Accumulated, ...AppliedParams]>) & {readonly [key:string]: [...Accumulated, ...AppliedParams][number]}
            : ReturnType<F>;

/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 * Can optionally be used to bind the supplied parameters onto the function
 */
export function curry<F extends (...args: any[]) => any>(fn: F, appliedParameters: object = {}): Curried<F> {
    return create(fn, appliedParameters, parametersOf(fn));
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
        if (p === 'length') return this.parametersSignature.length - Object.keys(this.allParameters()).length;
        if (p in fn) return Reflect.get(fn, p);
        return Reflect.get(this.appliedParameters, p);
    }

    has(fn: T, p: string | symbol): boolean {
        return p in fn || Object.hasOwn(this.appliedParameters, p);
    }
}
