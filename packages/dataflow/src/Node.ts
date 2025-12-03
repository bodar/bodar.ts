/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */

export interface Version<T> {
    value: T;
    version: number;
}

export interface Node<T> extends AsyncIterable<Version<T>> {
    key: string;
    dependencies: Node<T>[];
    fun: Function;
}