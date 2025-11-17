import {equal} from "@bodar/totallylazy/functions/equal.ts";
import {isAsyncIterable, isAsyncIterator} from "./IsAsyncIterable.ts";
import {combineLatest} from "./combineLatest.ts";

export interface Node<T = any> extends AsyncIterable<T> {
    key: string;
    dependencies: Node[];
    fun: Function;
}

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

    async* execute(currentInputs: any[]) {
        if (equal(this.lastInputs, currentInputs)) {
            yield* this.processResult(this.lastResult);
        } else {
            let currentResult = this.fun(...currentInputs);
            this.lastInputs = currentInputs.slice();
            this.lastResult = currentResult;
            yield* this.processResult(currentResult);
        }
    }

    async* processResult(result: any) {
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

export function node(key: string, dependencies: Node[], fun: Function) {
    return new DependantNode(key, dependencies, fun)
}