/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {isAsyncIterable, isAsyncIterator} from "./IsAsyncIterable.ts";
import {combineLatest} from "./combineLatest.ts";
import {equal} from "@bodar/totallylazy/functions/equal.ts";
import {SharedAsyncIterable, Backpressure, type BackpressureStrategy} from "./SharedAsyncIterable.ts";

/** Node implementation that uses combineLatest to merge dependency streams and memoizes results */
export class Node<T> implements AsyncIterable<T> {
    private shared?: SharedAsyncIterable<T>;

    constructor(public key: string, public dependencies: Node<any>[], public fun: Function, private backpressure: BackpressureStrategy) {
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        if (!this.shared) this.shared = new SharedAsyncIterable<T>({
            [Symbol.asyncIterator]: () => this.create()
        }, this.backpressure)
        return this.shared[Symbol.asyncIterator]();
    }

    async* create(): AsyncIterator<T> {
        for await (const currentInputs of combineLatest(this.dependencies)) {
            yield* this.execute(currentInputs);
        }
    }

    private lastInputs?: any[];
    private lastResult?: any;

    async* execute(currentInputs: any[]): AsyncGenerator<T> {
        if (equal(this.lastInputs, currentInputs)) {
            yield* this.processResult(this.lastResult);
        } else {
            let currentResult = this.fun(...currentInputs);
            this.lastInputs = currentInputs.slice();
            this.lastResult = currentResult;
            yield* this.processResult(currentResult);
        }
    }

    async* processResult(result: any): AsyncGenerator<T> {
        if (isAsyncIterable(result)) {
            yield* result;
        } else if (isAsyncIterator(result)) {
            yield* {
                [Symbol.asyncIterator]() {
                    return result;
                }
            };
        } else {
            yield result;
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: Node<any>[], fun: Function, backpressure: BackpressureStrategy = Backpressure.fastest): Node<T> {
    return new Node(key, dependencies, fun, backpressure)
}