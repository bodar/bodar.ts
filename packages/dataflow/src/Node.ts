/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {isAsyncIterable, isAsyncIterator} from "./IsAsyncIterable.ts";
import {combineLatest} from "./combineLatest.ts";
import {equal} from "@bodar/totallylazy/functions/equal.ts";

/** A reactive node that emits values based on its dependencies */
export interface Node<T = any> extends AsyncIterable<T> {
    key: string;
    dependencies: Node[];
    fun: Function;
}

/** Node implementation that uses combineLatest to merge dependency streams and memoizes results */
export class DependantNode<T> implements Node, AsyncIterable<T> {
    constructor(public key: string, public dependencies: Node[], public fun: Function) {
    }

    async* [Symbol.asyncIterator](): AsyncIterator<T, any, any> {
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
            throw new Error('Not implemented');
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
export function node(key: string, dependencies: Node[], fun: Function): Node {
    return new DependantNode(key, dependencies, fun)
}