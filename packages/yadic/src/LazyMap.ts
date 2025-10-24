/**
 * Lazy dependency injection container with type-safe dependency tracking.
 *
 * LazyMap provides a builder pattern for defining dependencies that are only
 * initialized on first access. Once accessed, dependencies are automatically
 * cached as immutable properties for optimal performance.
 *
 * Supports constructor injection, decoration pattern, parent-child containers,
 * and full TypeScript type inference for all registered dependencies.
 *
 * @module
 *
 * @example
 * ```ts
 * import { LazyMap, instance, constructor } from "@bodar/yadic/LazyMap";
 *
 * class Database {
 *   constructor(deps: Dependency<'url', string>) {
 *     this.connect(deps.url);
 *   }
 * }
 *
 * const container = LazyMap.create()
 *   .set('url', instance('postgres://localhost'))
 *   .set('db', constructor(Database));
 *
 * const db = container.db; // Initialized on first access
 * ```
 */

import {chain} from "./chain.ts";
import type {AutoConstructor, Constructor, Dependency} from "./types.ts";

/**
 * A lazy dependency injection container with type-safe dependency tracking.
 *
 * LazyMap uses a builder pattern to define dependencies as factory functions.
 * Dependencies are only computed on first access via property getters, then
 * automatically cached as immutable properties for optimal performance.
 *
 * Supports parent-child containers, decoration pattern, and full TypeScript
 * type inference for all registered dependencies.
 *
 * @template P - Parent container type (if any)
 *
 * @example
 * ```ts
 * const container = LazyMap.create()
 *   .set('port', instance(8080))
 *   .set('url', (deps) => `http://localhost:${deps.port}`);
 *
 * console.log(container.url); // 'http://localhost:8080'
 * ```
 */
export class LazyMap {
    private deps: this;

    private constructor(parent?: object) {
        this.deps = parent ? chain(this, parent) : this;
    }

    /**
     * Creates a new LazyMap instance, optionally inheriting from a parent container.
     *
     * When a parent is provided, the child container can access all parent
     * dependencies through the chaining mechanism.
     *
     * @template P - Parent container type
     * @param parent - Optional parent container to inherit from
     * @returns New LazyMap instance with access to parent dependencies
     *
     * @example
     * ```ts
     * const parent = LazyMap.create()
     *   .set('apiUrl', instance('https://api.example.com'));
     *
     * const child = LazyMap.create(parent)
     *   .set('endpoint', (deps) => `${deps.apiUrl}/users`);
     * ```
     */
    static create<P>(parent?: P): LazyMap & P {
        return new LazyMap(parent as any) as any;
    }

    /**
     * Registers a dependency with a factory function for lazy initialization.
     *
     * The factory receives all current dependencies except the one being defined.
     * On first access, the factory is called and the result is cached as an
     * immutable property. Once accessed, the property cannot be redefined.
     *
     * @template K - Property key type
     * @template V - Property value type
     * @param key - The dependency key
     * @param fun - Function that receives dependencies and returns the value
     * @returns This container with the new dependency added to its type
     *
     * @example
     * ```ts
     * const map = LazyMap.create()
     *   .set('port', () => 8080)
     *   .set('url', (deps) => `http://localhost:${deps.port}`);
     * ```
     */
    set<K extends PropertyKey, V>(key: K, fun: (deps: Omit<this, K>) => V): this & Dependency<K, V> {
        const self = this;
        return Object.defineProperty(this, key, {
            get: function () {
                const value = fun(self.deps);
                Object.defineProperty(this, key, {value, configurable: false});
                return value;
            },
            configurable: true,
            enumerable: true
        }) as any;
    }

    /**
     * Wraps an existing dependency with additional functionality.
     *
     * Removes the original dependency, then re-registers it with a decorator
     * function that receives both the original value and all dependencies.
     * Useful for adding cross-cutting concerns like logging or caching.
     *
     * @template K - Property key type
     * @template V - Property value type
     * @param key - The dependency key to decorate
     * @param fun - Function that receives original value plus all dependencies
     * @returns This container with the decorated dependency
     * @throws {Error} If the key doesn't exist in the container
     *
     * @example
     * ```ts
     * const map = LazyMap.create()
     *   .set('logger', constructor(Logger))
     *   .decorate('logger', constructor(TimestampLogger));
     * ```
     */
    decorate<K extends keyof this, V>(key: K, fun: (deps: this) => V): this & Dependency<K, V> {
        const p = Object.getOwnPropertyDescriptor(this, key);
        if (!p) throw new Error(`No previous key for '${String(key)}' found`);
        delete this[key];
        return this.set(String(key), deps => {
            return fun(chain(Object.defineProperty({}, key, p), deps) as this);
        }) as any;
    }
}

/**
 * Checks if a function is a constructor (has a prototype).
 *
 * Tests whether a function is a class constructor or a regular function
 * by checking for the presence of a prototype property that references
 * the function itself.
 *
 * @param func - Function to test
 * @returns True if func is a constructor, false otherwise
 *
 * @example
 * ```ts
 * class MyClass {}
 * function myFunc() {}
 *
 * console.log(isConstructor(MyClass)); // true
 * console.log(isConstructor(myFunc)); // false
 * ```
 */
export function isConstructor(func: Function): boolean {
    return !!func.prototype && func.prototype.constructor === func;
}

/**
 * Creates a dependency factory that aliases another dependency.
 *
 * Returns a factory function that extracts a specific property from the
 * dependencies object. Useful for creating shorter names or references
 * to existing dependencies.
 *
 * @template T - Dependencies object type
 * @template K - Property key type
 * @param key - The dependency key to alias
 * @returns Factory function that returns the aliased dependency value
 *
 * @example
 * ```ts
 * const map = LazyMap.create()
 *   .set('primaryDatabase', instance(new Database()))
 *   .set('db', alias('primaryDatabase'));
 * ```
 */
export function alias<T extends object, K extends keyof T>(key: K): (deps: T) => T[K] {
    return (deps: T) => Reflect.get(deps, key);
}

/**
 * Wraps a constant value as a dependency factory.
 *
 * Creates a zero-argument factory function that returns the provided value.
 * Use this helper to register constant values or pre-constructed objects
 * as dependencies.
 *
 * @template T - Value type
 * @param value - The constant value to wrap
 * @returns Factory function that returns the value
 *
 * @example
 * ```ts
 * const map = LazyMap.create()
 *   .set('config', instance({ debug: true, port: 3000 }))
 *   .set('version', instance('1.0.0'));
 * ```
 */
export function instance<T>(value: T): () => T {
    return () => value;
}

/**
 * Creates a dependency factory for automatic constructor invocation.
 *
 * Wraps a class constructor to be invoked automatically when the dependency
 * is accessed. Supports constructors with 0 arguments or 1 argument (dependencies).
 *
 * @template D - Dependencies type
 * @template T - Instance type
 * @param valueConstructor - Constructor function to wrap
 * @returns Factory function that instantiates the class
 * @throws {Error} If constructor is not a constructor function
 * @throws {Error} If constructor has an unsupported number of parameters
 *
 * @example
 * ```ts
 * class Service {
 *   constructor(deps: Dependency<'config', Config>) {
 *     this.config = deps.config;
 *   }
 * }
 *
 * const map = LazyMap.create()
 *   .set('config', instance(new Config()))
 *   .set('service', constructor(Service));
 * ```
 */
export function constructor<D, T>(valueConstructor: Constructor<T> | AutoConstructor<D, T>): (() => T) | ((deps: D) => T) {
    if (!isConstructor(valueConstructor)) throw new Error(`${valueConstructor.name} is not a constructor`);
    if (valueConstructor.length === 0) { // @ts-ignore
        return () => new valueConstructor();
    }
    if (valueConstructor.length === 1) return (deps: D) => new valueConstructor(deps);
    throw new Error(`${valueConstructor.name} must take either no arguments or a dependency object. Use set() with function for other use cases`);
}
