import {replace} from "../functions/replace.ts";

interface GetterPropertyDescriptor<T, V> {
    get: (this: T) => V;
}

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

function lazyProxy<A extends object>(fn: () => A): A {
    return new Proxy<A>({} as any, new Handler(fn));
}

/** Returns a lazy proxy for the object returned by the function  */
export function lazy<A extends object>(fn: () => A): A;
/** Makes a get method become lazy */
export function lazy<A extends object, K extends keyof A, V extends A[K]>(_target: A, name: K, descriptor: TypedPropertyDescriptor<V> /* GetterPropertyDescriptor<T, V> */): GetterPropertyDescriptor<A, V> ;
export function lazy(...args: any[]): any {
    if (args.length === 1) return lazyProxy(args[0]);
    return lazyDecorator(args[0], args[1], args[2]);
}