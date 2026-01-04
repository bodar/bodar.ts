/**
 * Object chaining utilities for merging multiple objects with precedence.
 *
 * The chain function and types enable merging objects where earlier objects
 * take precedence over later ones. Implemented using ES6 Proxy for efficient
 * runtime property lookup.
 *
 * @module
 *
 * @example
 * ```ts
 * import { chain } from "@bodar/yadic/chain";
 *
 * const defaults = { timeout: 5000, retries: 3 };
 * const overrides = { timeout: 10000 };
 *
 * const config = chain(overrides, defaults);
 * console.log(config.timeout); // 10000 (from overrides)
 * console.log(config.retries); // 3 (from defaults)
 * ```
 */

/**
 * Type utility that overwrites properties from T with properties from U.
 *
 * Removes keys from T that exist in U, then intersects with U to create
 * a new type where U's properties take precedence.
 *
 * @template T - The base type
 * @template U - The overriding type
 *
 * @example
 * ```ts
 * type Base = { a: number; b: string };
 * type Override = { a: string };
 * type Result = Overwrite<Base, Override>;
 * // Result is { b: string; a: string }
 * ```
 */
export type Overwrite<T, U> = Omit<T, keyof U> & U;

/**
 * Recursively merges a tuple of types with earlier types taking precedence.
 *
 * Processes an array of types from left to right, where properties in earlier
 * types override properties in later types. The result is a single merged type.
 *
 * @template T - Tuple array of types to merge
 *
 * @example
 * ```ts
 * type Config = Chain<[{ timeout: number }, { timeout: string; retries: number }]>;
 * // Config is { timeout: number; retries: number }
 * ```
 */
export type Chain<T extends any[]> = T extends [infer First, ...infer Rest]
    ? Overwrite<Chain<Rest>, First>
    : {};

/**
 * Chains multiple objects together with earlier objects taking precedence.
 *
 * Creates a Proxy that searches through objects in order, returning the first
 * found property. Properties from objects earlier in the array override those
 * in later objects. Useful for configuration merging and defaults.
 *
 * @template T - Tuple array of object types to chain
 * @param objects - Objects to chain, with earlier objects having higher precedence
 * @returns A proxy that combines all objects with proper precedence
 *
 * @example
 * ```ts
 * const defaults = { timeout: 5000, retries: 3 };
 * const overrides = { timeout: 10000 };
 * const config = chain(overrides, defaults);
 * console.log(config.timeout); // 10000
 * console.log(config.retries); // 3
 * ```
 */
export function chain<T extends object[]>(...objects: T): Chain<T> {
    return new Proxy({}, {
        get(_target, prop, _receiver) {
            for (const obj of objects) {
                try {
                    const result = Reflect.get(obj, prop, obj);
                    if (prop in obj || typeof result !== 'undefined') return result;
                } catch (_e) {
                }
            }
        },
        has(_target: {}, prop: string | symbol): boolean {
            for (const obj of objects) {
                if (Reflect.has(obj, prop)) return true;
            }
            return false;
        }
    }) as Chain<T>
}
