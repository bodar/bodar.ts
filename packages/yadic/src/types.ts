export type Dependency<K extends PropertyKey, V> = {
    readonly [P in K]: V;
}

export interface AutoConstructor<D, T> {
    new(deps: D): T
}

export interface Constructor<T> {
    new(): T
}

