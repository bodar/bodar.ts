/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {combineLatest} from "./combineLatest.ts";
import {type BackpressureStrategy, SharedAsyncIterable} from "./SharedAsyncIterable.ts";
import type {ThrottleStrategy} from "./Throttle.ts";
import {type Node} from "./Node.ts";
import {toAsyncIterable} from "./toAsyncIterable.ts";
import {AsyncIteratorRacer} from "./AsyncIteratorRacer.ts";

/** Node implementation that uses combineLatest to merge dependency streams and memoizes results */
export class PullNode<T> implements Node<T> {
    public value: T | undefined;
    private shared: SharedAsyncIterable<T>;

    constructor(public key: string, public dependencies: PullNode<any>[], public fun: Function,
                private backpressure: BackpressureStrategy,
                private throttle: ThrottleStrategy) {
        this.shared = new SharedAsyncIterable<T>({[Symbol.asyncIterator]:() => this.create()}, this.backpressure);
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return this.shared[Symbol.asyncIterator]();
    }

    async* create(): AsyncGenerator<T> {
        await using racer = new AsyncIteratorRacer<string, any>([['inputs', combineLatest(this.dependencies)[Symbol.asyncIterator]()]]);

        for await (const resolved of racer) {
            if (resolved.has('inputs')) {
                const newInputs = resolved.get('inputs')!.value;
                invalidate(this.value);
                this.value = this.fun(...newInputs);
                racer.set('values', toAsyncIterable<T>(this.value)[Symbol.asyncIterator]());
            }
            if (resolved.has('values')) {
                yield resolved.get('values')!.value;
                await this.throttle();
            }
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PullNode<any>[], fun: Function, backpressure: BackpressureStrategy, throttle: ThrottleStrategy): PullNode<T> {
    return new PullNode(key, dependencies, fun, backpressure, throttle)
}

function invalidate(value: any): void {
    try {
        if (value === undefined || value === null) return;
        if (value instanceof AbortController) {
            value.abort();
        } else if (typeof value[Symbol.dispose] === 'function') {
            value[Symbol.dispose]();
        } else if (typeof value[Symbol.asyncDispose] === 'function') {
            value[Symbol.asyncDispose](); // Don't await - may hang if not interruptible
        }
    } catch (e) {
        console.error('Error during invalidate:', e);
    }
}