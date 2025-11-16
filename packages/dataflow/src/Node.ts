import {equal} from "@bodar/totallylazy/functions/equal.ts";
import {isAsyncIterable, isAsyncIterator} from "./IsAsyncIterable.ts";

export interface Node<T = any> extends AsyncIterable<T> {
    key: string;
    dependencies: Node[];
    fun: Function;
}

export class DependantNode<T> implements Node, AsyncIterable<T> {
    constructor(public key: string, public dependencies: Node[], public fun: Function) {
    }

    async* [Symbol.asyncIterator](): AsyncIterator<T, any, any> {
        const iterators = this.dependencies.map(d => d[Symbol.asyncIterator]());

        let results = await Promise.all(iterators.map(i => i.next()));
        let currentInputs = results.map(r => r.value);
        yield* this.execute(currentInputs);

        // Create ONE pending promise per active iterator
        const pending = new Map<number, Promise<{ index: number, result: IteratorResult<any> }>>();

        for (let i = 0; i < iterators.length; i++) {
            if (!results[i].done) {
                pending.set(i, iterators[i].next().then(result => ({index: i, result})));
            }
        }

        while (pending.size > 0) {
            // Race current pending promises
            const {index, result} = await Promise.race(pending.values());

            // Remove this promise from pending
            pending.delete(index);

            // Update state
            results[index] = result;

            if (!result.done) {
                currentInputs[index] = result.value;

                // Create NEW promise for this iterator
                pending.set(index, iterators[index].next().then(r => ({index, result: r})));

                yield* this.execute(currentInputs);
            }
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