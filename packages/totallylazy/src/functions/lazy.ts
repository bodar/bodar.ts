import {replace} from "../functions/replace.ts";

/**
 * Property descriptor for getter methods, used internally for lazy evaluation
 *
 * Ideally we could use this on both the parameter and the return type, but TypeScript doesn't support
 * detecting the target property has a getter.
 */
interface GetterPropertyDescriptor<T, V> {
    get: (this: T) => V;
}

/**
 * Internal decorator implementation for lazy getters
 * @internal
 */
function lazyDecorator<T extends object, K extends keyof T, V extends T[K]>(_target: T, name: K, descriptor: TypedPropertyDescriptor<V> /* GetterPropertyDescriptor<T, V> */): GetterPropertyDescriptor<T, V> {
    if (typeof descriptor.get === 'undefined') throw new Error("@lazy can only decorate getter methods");
    return {
        ...descriptor,
        get(this: T): V {
            const result: V = descriptor.get!.call(this);
            replace(this, name, result);
            return result;
        }
    };
}

/**
 * Internal proxy handler for lazy initialization
 * @internal
 */
class Handler<A extends object> implements ProxyHandler<A>{
    constructor(private fn: () => A) {
    }

    @lazyDecorator get instance(): A {
        return this.fn();
    }

    get(_target: A, property: PropertyKey, receiver: any): any {
        return Reflect.get(this.instance, property, receiver);
    }

    set(_target: A, property: PropertyKey, value: any, receiver: any): boolean {
        return Reflect.set(this.instance, property, value, receiver);
    }
}

/**
 * Internal function to create a lazy proxy
 * @internal
 */
function lazyProxy<A extends object>(fn: () => A): A {
    return new Proxy<A>({} as any, new Handler(fn));
}

/**
 * Lazy evaluation utility for deferring expensive computations
 *
 * Can be used as a function wrapper to create a lazy proxy, or as a decorator for getter methods.
 * The wrapped function or getter is only executed once when first accessed, and the result is cached.
 *
 * @example
 * ```typescript
 * // As function wrapper
 * const expensive = lazy(() => {
 *   console.log('Computing...');
 *   return { result: 42 };
 * });
 * expensive.result; // Logs 'Computing...' and returns 42
 * expensive.result; // Returns cached 42 without logging
 *
 * // As decorator
 * class Example {
 *   @lazy
 *   get computed() {
 *     console.log('Computing...');
 *     return 42;
 *   }
 * }
 * const ex = new Example();
 * ex.computed; // Logs 'Computing...' and returns 42
 * ex.computed; // Returns cached 42 without logging
 * ```
 */
export function lazy<A extends object>(fn: () => A): A;
export function lazy<A extends object, K extends keyof A, V extends A[K]>(_target: A, name: K, descriptor: TypedPropertyDescriptor<V> /* GetterPropertyDescriptor<T, V> */): GetterPropertyDescriptor<A, V> ;
export function lazy(...args: any[]): any {
    if (args.length === 1) return lazyProxy(args[0]);
    return lazyDecorator(args[0], args[1], args[2]);
}