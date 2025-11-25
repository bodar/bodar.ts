/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {isAsyncGeneratorFunction, isAsyncIterable, isAsyncIterator, isGeneratorFunction} from "./type-guards.ts";
import {combineLatest} from "./combineLatest.ts";
import {type BackpressureStrategy, SharedAsyncIterable} from "./SharedAsyncIterable.ts";
import type {ThrottleStrategy} from "./Throttle.ts";
import {type Node} from "./Node.ts";

/** Node implementation that uses combineLatest to merge dependency streams and memoizes results */
export class PullNode<T> implements Node<T>, AsyncIterable<T> {
    public value: T | undefined;
    private inputs?: any[];
    private shared?: SharedAsyncIterable<T>;

    constructor(public key: string, public dependencies: PullNode<any>[], public fun: Function,
                private backpressure: BackpressureStrategy,
                private throttle: ThrottleStrategy) {
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

    async* execute(newInputs: any[]): AsyncGenerator<T> {
        if (this.shallowEqual(this.inputs, newInputs)) {
            yield* this.processResult(this.value);
        } else {
            this.value = this.fun(...newInputs);
            this.inputs = newInputs.slice();
            yield* this.processResult(this.value);
        }
    }

    private shallowEqual(a: any[] | undefined, b: any[]): boolean {
        if (a === undefined) return false;
        if (a.length != b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    async* processResult(result: any): AsyncGenerator<T> {
        const iterable = this.getIterable(result);
        if (iterable) {
            for await (const value of iterable) {
                yield value;
                await this.throttle();
            }
        } else {
            yield result;
        }
    }

    getIterable(result: any): AsyncIterable<T> | undefined {
        if (isAsyncIterable(result)) {
            return result;
        } else if (isAsyncIterator(result)) {
            return {
                [Symbol.asyncIterator]() {
                    return result;
                }
            };
        } else if (isAsyncGeneratorFunction(result) && result.length === 0) {
            return {
                [Symbol.asyncIterator]() {
                    return result() as AsyncGenerator<T>;
                }
            };
        } else if (isGeneratorFunction(result) && result.length === 0) {
            const iterator = result() as Generator<T>;
            return {
                async* [Symbol.asyncIterator]() {
                    yield* {
                        [Symbol.iterator]() {
                            return iterator
                        }
                    }
                }
            };
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PullNode<any>[], fun: Function, backpressure: BackpressureStrategy, throttle: ThrottleStrategy): PullNode<T> {
    return new PullNode(key, dependencies, fun, backpressure, throttle)
}