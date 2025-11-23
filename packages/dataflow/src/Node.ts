/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */

export interface Node<T> extends AsyncIterable<T> {
    key: string;
    dependencies: Node<T>[];
    fun: Function;
}