/** @module Functions to support currying functions */

import {Parameter, parametersOf} from "./parameters.ts";

/**
 * Placeholder symbol to allow calling curried functions in any order.
 * Can be used in place of any argument type.
 */
export const _ = Symbol('placeholderSymbol');

const curried = Symbol('curried');

/** Used to detect if a function has already been curried */
export function isCurried(value: any): boolean {
    return Reflect.has(value, curried);
}

/** Type for a function */
export type Fn = (...args: any[]) => any;

/** Type representing the placeholder symbol used in curried functions. */
export type Placeholder = typeof _;

/** Maps a tuple type to allow Placeholder as a value for each element. */
export type AllowPlaceholder<T extends any[]> = {
    [K in keyof T]: T[K] | Placeholder;
};

/** Extracts function parameters with first required and rest optional, allowing Placeholder values. */
export type RequiredFirstParam<F extends Fn> =
    Parameters<F> extends [infer Head, ...infer Tail]
        ? [Head | Placeholder, ...Partial<AllowPlaceholder<Tail>>]
        : [];

/** Calculates remaining parameters after applying arguments, skipping positions with Placeholder. */
export type RemainingParameters<AppliedParams extends any[], ExpectedParams extends any[]> =
    AppliedParams extends [infer AHead, ...infer ATail]
        ? ExpectedParams extends [infer EHead, ...infer ETail]
            ? AHead extends Placeholder
                ? [EHead, ...RemainingParameters<ATail, ETail>]
                : RemainingParameters<ATail, ETail>
            : []
        : ExpectedParams;

/** Type representing a curried function that supports partial application and placeholders. */
export type Curried<F extends Fn, Accumulated extends any[] = []> =
    <AppliedParams extends RequiredFirstParam<F>>(...args: AppliedParams) =>
        RemainingParameters<AppliedParams, Parameters<F>> extends [any, ...any[]]
            ? (Curried<(...args: RemainingParameters<AppliedParams, Parameters<F>>) => ReturnType<F>, [...Accumulated, ...AppliedParams]>) & {
            readonly [key: string]: [...Accumulated, ...AppliedParams][number]
        }
            : ReturnType<F>;

/**
 * Curries a function, enabling partial application while exposing applied arguments as properties.
 * Can optionally be used to bind the supplied parameters onto the function
 */
export function curry<F extends Fn>(fn: F, appliedParameters: object = {}): Curried<F> {
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
        if (this.signatureLength() <= Object.keys(allParameters).length) {
            const restArgs = Reflect.get(allParameters, '...');
            if (restArgs) Reflect.deleteProperty(allParameters, '...');
            const values = Object.values(allParameters);
            return Reflect.apply(fn, self, restArgs ? [...values, ...restArgs] : values);
        }
        return create(fn, allParameters, this.parametersSignature);
    }

    private allParameters(args: any[] = []) {
        const properties = this.parametersSignature.reduce((properties, parameter) => {
            if (Object.hasOwn(this.appliedParameters, parameter.name)) {
                const value = Reflect.get(this.appliedParameters, parameter.name);
                if (!(parameter.hasDefault && typeof value === 'undefined')) {
                    Reflect.set(properties, parameter.name, value);
                    return properties;
                }
            }
            if (args.length > 0 && !parameter.name.startsWith('...')) {
                const arg = args.shift();
                if (arg !== _) Reflect.set(properties, parameter.name, arg);
            } else if (parameter.hasDefault) Reflect.set(properties, parameter.name, undefined);
            return properties;
        }, {});
        if (args.length > 0) Reflect.set(properties, '...', args);
        return properties;
    }

    get(fn: T, p: string | symbol, _receiver: any): any {
        if (p === 'toString') {
            if (fn.name) return () => `${fn.name}(${Object.values(this.allParameters()).join(', ')})`;
            else return () => fn.toString();
        }
        if (p === 'length') return this.signatureLength() - Object.keys(this.allParameters()).length;
        if (p in fn) return Reflect.get(fn, p);
        return Reflect.get(this.appliedParameters, p);
    }

    private signatureLength() {
        return this.parametersSignature.filter(p => !p.name.startsWith("...")).length;
    }

    has(fn: T, p: string | symbol): boolean {
        if (p === curried) return true;
        return p in fn || Object.hasOwn(this.appliedParameters, p);
    }
}
