import {chain} from "./chain.ts";
import type {AutoConstructor, Constructor, Dependency} from "./types.ts";

export class LazyMap {
    private deps: this;

    private constructor(parent?: object) {
        this.deps = parent ? chain(this, parent) : this;
    }

    static create<P>(parent?: P): LazyMap & P {
        return new LazyMap(parent as any) as any;
    }

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

    decorate<K extends keyof this, V>(key: K, fun: (deps: this) => V): this & Dependency<K, V> {
        const p = Object.getOwnPropertyDescriptor(this, key);
        if (!p) throw new Error(`No previous key for '${String(key)}' found`);
        delete this[key];
        return this.set(String(key), deps => {
            return fun(chain(Object.defineProperty({}, key, p), deps) as this);
        }) as any;
    }
}

export function isConstructor(func: Function): boolean {
    return !!func.prototype && func.prototype.constructor === func;
}

export function alias<T extends object, K extends keyof T>(key: K): (deps: T) => T[K] {
    return (deps: T) => Reflect.get(deps, key);
}

export function instance<T>(value: T): () => T {
    return () => value;
}

export function constructor<D, T>(valueConstructor: Constructor<T> | AutoConstructor<D, T>): (() => T) | ((deps: D) => T) {
    if (!isConstructor(valueConstructor)) throw new Error(`${valueConstructor.name} is not a constructor`);
    if (valueConstructor.length === 0) { // @ts-ignore
        return () => new valueConstructor();
    }
    if (valueConstructor.length === 1) return (deps: D) => new valueConstructor(deps);
    throw new Error(`${valueConstructor.name} must take either no arguments or a dependency object. Use set() with function for other use cases`);
}