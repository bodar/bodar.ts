/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {combineLatest} from "./combineLatest.ts";
import {type BackpressureStrategy, SharedAsyncIterable} from "./SharedAsyncIterable.ts";
import type {ThrottleStrategy} from "./Throttle.ts";
import {type Node, type Version} from "./Node.ts";
import {toAsyncIterable} from "./toAsyncIterable.ts";

/** Node implementation that uses combineLatest to merge dependency streams and memoizes results */
export class PullNode<T> implements Node<T> {
    public value: T | undefined;
    private inputs?: Version<any>[];
    private shared?: SharedAsyncIterable<Version<T>>;

    constructor(public key: string, public dependencies: PullNode<any>[], public fun: Function,
                private backpressure: BackpressureStrategy,
                private throttle: ThrottleStrategy) {
    }

    [Symbol.asyncIterator](): AsyncIterator<Version<T>> {
        if (!this.shared) this.shared = new SharedAsyncIterable<Version<T>>(version(() => this.create()), this.backpressure)
        return this.shared[Symbol.asyncIterator]();
    }

    async* create(): AsyncIterable<T> {
        const iterators = new Map<string, AsyncIterator<any>>();
        const pending = new Map<string, Promise<void>>();
        const resolved = new Map<string, any>();
        let {promise: signal, resolve: signalResolve} = Promise.withResolvers<void>();

        iterators.set('inputs', combineLatest(this.dependencies)[Symbol.asyncIterator]());

        try {
            while (true) {
                for (const [name, iterator] of iterators) {
                    if (!pending.has(name)) {
                        pending.set(name, iterator.next().then(result => {
                            pending.delete(name);
                            result.done ? iterators.delete(name) : resolved.set(name, result.value);
                            signalResolve();
                        }));
                    }
                }

                await Promise.all([signal, Promise.resolve()]);
                ({promise: signal, resolve: signalResolve} = Promise.withResolvers<void>());

                if (resolved.has('inputs')) {
                    const newInputs = resolved.get('inputs');
                    resolved.delete('inputs');
                    if (!equal(this.inputs, newInputs)) {
                        await invalidate(this.value);
                        this.value = this.fun(...newInputs.map((v: Version<any>) => v.value));
                        this.inputs = newInputs.slice();
                    }
                    iterators.set('values', toAsyncIterable<T>(this.value)[Symbol.asyncIterator]());
                } else if (resolved.has('values')) {
                    yield resolved.get('values');
                    resolved.delete('values');
                    await this.throttle();
                } else if (pending.size === 0) {
                    break;
                }
            }
        }
        finally {
            await Promise.all([...iterators.values()].map((iterator) => iterator.return?.()));
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PullNode<any>[], fun: Function, backpressure: BackpressureStrategy, throttle: ThrottleStrategy): PullNode<T> {
    return new PullNode(key, dependencies, fun, backpressure, throttle)
}


/** Copied from TL so we don't add a dependency (and trimmed down) */
function equal(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a == 'number' && typeof b == 'number') return a !== a && b !== b;

    if (typeof a == 'object' && typeof b == 'object') {
        if (a.constructor !== b.constructor) return false;

        if (Array.isArray(a) && Array.isArray(b)) {
            if (a.length != b.length) return false;
            for (let i = 0; i < a.length; i++) {
                if (!equal(a[i], b[i])) return false;
            }
            return true;
        }

        if (typeof Node === 'function' && (a instanceof Node) && (b instanceof Node)) {
            return a.isEqualNode(b);
        }

        if (a.constructor === Object) {
            return equal(Object.entries(a).sort(by(v => v[0])), Object.entries(b).sort(by(v => v[0])));
        }
    }

    return false;
}

function by<A, B>(mapper: (a: A) => B, comparator: (a: B, b: B) => number = ascending): (a: A, b: A) => number {
    return (a, b) => comparator(mapper(a), mapper(b));
}

function ascending<T>(a: T, b: T): number {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
}

function version<A>(fun: () => AsyncIterable<A>): AsyncIterable<Version<A>> {
    return {
        async* [Symbol.asyncIterator]() {
            let index = 0;
            for await (const a of fun()) {
                yield {value: a, version: index++};
            }
        }
    }
}

async function invalidate(value: unknown): Promise<void> {
    if (value === undefined || value === null) return;
    try {
        if (value instanceof AbortController) {
            value.abort();
        } else if (typeof value === 'object') {
            if (Symbol.asyncDispose in value) {
                await (value as AsyncDisposable)[Symbol.asyncDispose]();
            } else if (Symbol.dispose in value) {
                (value as Disposable)[Symbol.dispose]();
            }
        }
    } catch (e) {
        console.error('Error during invalidate:', e);
    }
}