/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {combineStamped} from "./combineLatest.ts";
import {type BackpressureStrategy, SharedAsyncIterable} from "./SharedAsyncIterable.ts";
import type {ThrottleStrategy} from "./Throttle.ts";
import {type Node} from "./Node.ts";
import {toAsyncIterable} from "./toAsyncIterable.ts";
import {AsyncIteratorRacer} from "./AsyncIteratorRacer.ts";
import {Invalidator} from "./Invalidator.ts";
import type {Stamp, Stamped} from "./Stamp.ts";

/**
 * Node implementation that combines dependency streams and memoizes results.
 * Internally every value carries a {@link Stamp} so that joins in diamond shaped graphs
 * only ever see consistent inputs; the public iterator yields plain values.
 */
export class PullNode<T> implements Node<T> {
    public value: T | undefined;
    private shared: SharedAsyncIterable<Stamped<T>>;
    private count = 0;

    constructor(public key: string, public dependencies: PullNode<any>[], public fun: Function,
                private backpressure: BackpressureStrategy,
                private throttle: ThrottleStrategy,
                private invalidator: Invalidator) {
        this.shared = new SharedAsyncIterable<Stamped<T>>({[Symbol.asyncIterator]: () => this.create()}, this.backpressure);
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        const iterator = this.shared[Symbol.asyncIterator]();
        return {
            async next(): Promise<IteratorResult<T>> {
                const result = await iterator.next();
                return result.done ? result : {done: false, value: result.value.value};
            },
            async return(value?: any): Promise<IteratorResult<T>> {
                await iterator.return?.(value);
                return {done: true, value};
            }
        };
    }

    /** Values with their stamps, for dependent nodes */
    stamped(): AsyncIterable<Stamped<T>> {
        return this.shared;
    }

    async* create(): AsyncGenerator<Stamped<T>> {
        await using racer = new AsyncIteratorRacer<string, any>([['inputs', combineStamped(this.dependencies.map(d => d.stamped()))[Symbol.asyncIterator]()]]);
        let stamp: Stamp | undefined;

        for await (const resolved of racer) {
            if (resolved.has('inputs')) {
                const inputs: Stamped<any[]> = resolved.get('inputs')!.value;
                this.invalidator.invalidate(this.value);
                this.value = this.fun(...inputs.value);
                stamp = inputs.stamp;
                racer.set('values', toAsyncIterable<T>(this.value)[Symbol.asyncIterator]());
            } else if (resolved.has('values')) {
                // Every yield ticks this node's own clock, so joins can tell its values apart
                yield {value: resolved.get('values')!.value, stamp: new Map(stamp).set(this, ++this.count)};
                await this.throttle();
            }
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PullNode<any>[], fun: Function, backpressure: BackpressureStrategy, throttle: ThrottleStrategy, invalidator: Invalidator): PullNode<T> {
    return new PullNode(key, dependencies, fun, backpressure, throttle, invalidator)
}