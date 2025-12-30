/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */

/** Versioned value wrapper for tracking changes */
export interface Version<T> {
    value: T;
    version: number;
}

/** Reactive node that yields versioned values as dependencies change */
export interface Node<T> extends AsyncIterable<T> {
    key: string;
    dependencies: Node<T>[];
    fun: Function;
}