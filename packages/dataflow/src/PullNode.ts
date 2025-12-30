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
    // private inputs?: any[];
    private shared?: SharedAsyncIterable<T>;

    constructor(public key: string, public dependencies: PullNode<any>[], public fun: Function,
                private backpressure: BackpressureStrategy,
                private throttle: ThrottleStrategy) {
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        if (!this.shared) this.shared = new SharedAsyncIterable<T>({[Symbol.asyncIterator]:() => this.create()}, this.backpressure)
        return this.shared[Symbol.asyncIterator]();
    }

    async* create(): AsyncGenerator<T> {
        await using racer = new AsyncIteratorRacer<string, any>([['inputs', combineLatest(this.dependencies)[Symbol.asyncIterator]()]]);

        for await (const resolved of racer) {
            if (resolved.has('inputs')) {
                const newInputs = resolved.get('inputs')!.value;
                await invalidate(this.value);
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


// /** Copied from TL so we don't add a dependency (and trimmed down) */
// function equal(a: unknown, b: unknown): boolean {
//     if (a === b) return true;
//     if (a === null || b === null) return false;
//     if (typeof a !== typeof b) return false;
//
//     if (typeof a == 'number' && typeof b == 'number') return a !== a && b !== b;
//
//     if (typeof a == 'object' && typeof b == 'object') {
//         if (a.constructor !== b.constructor) return false;
//
//         if (Array.isArray(a) && Array.isArray(b)) {
//             if (a.length != b.length) return false;
//             for (let i = 0; i < a.length; i++) {
//                 if (!equal(a[i], b[i])) return false;
//             }
//             return true;
//         }
//
//         if (typeof Node === 'function' && (a instanceof Node) && (b instanceof Node)) {
//             return a.isEqualNode(b);
//         }
//
//         if (a.constructor === Object) {
//             return equal(Object.entries(a).sort(by(v => v[0])), Object.entries(b).sort(by(v => v[0])));
//         }
//     }
//
//     return false;
// }
//
// function by<A, B>(mapper: (a: A) => B, comparator: (a: B, b: B) => number = ascending): (a: A, b: A) => number {
//     return (a, b) => comparator(mapper(a), mapper(b));
// }
//
// function ascending<T>(a: T, b: T): number {
//     if (a < b) return -1;
//     if (a > b) return 1;
//     return 0;
// }

// function version<A>(fun: () => AsyncIterable<A>): AsyncIterable<Version<A>> {
//     return {
//         async* [Symbol.asyncIterator]() {
//             let index = 0;
//             for await (const a of fun()) {
//                 yield {value: a, version: index++};
//             }
//         }
//     }
// }

async function invalidate(value: any): Promise<void> {
    try {
        if (value === undefined || value === null) return;
        if (value instanceof AbortController) {
            value.abort();
        } else if (typeof value[Symbol.dispose] === 'function') {
            value[Symbol.dispose]();
        } else if (typeof value[Symbol.asyncDispose] === 'function') {
            await value[Symbol.asyncDispose]();
        }
    } catch (e) {
        console.error('Error during invalidate:', e);
    }
}