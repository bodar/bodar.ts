/**
 * Races multiple async iterators, yielding results as they resolve.
 * Benefits over Promise.race:
 *  1. No memory leaks
 *  2. Races multiple at a time
 *  3. Can pull a subset of keys, letting a join wait for the inputs that are behind (see combineStamped)
 */
export class AsyncIteratorRacer<K, V> {
    private iterators: Map<K, AsyncIterator<V>>;
    private pending = new Map<K, Promise<void>>();
    private resolved = new Map<K, IteratorResult<V>>();
    private signal: PromiseWithResolvers<void> = Promise.withResolvers();
    private interrupted = false;

    constructor(entries?: Iterable<[K, AsyncIterator<V>]>) {
        this.iterators = new Map<K, AsyncIterator<V>>(entries)
    }

    set(key: K, iterator: AsyncIterator<V>): this {
        if (this.pending.has(key)) this.pending.delete(key);
        if (this.resolved.has(key)) this.resolved.delete(key);
        this.iterators.set(key, iterator);
        return this;
    }

    /** Is this key still being raced (not yet done) */
    has(key: K): boolean {
        return this.iterators.has(key);
    }

    /** Requests the next value of each key (default all) that is not already pending or resolved */
    pull(keys: Iterable<K> = this.iterators.keys()): void {
        for (const key of Array.from(keys)) {
            const iterator = this.iterators.get(key);
            if (iterator && !this.pending.has(key) && !this.resolved.has(key)) {
                this.pending.set(key, iterator.next().then(result => {
                    if (this.iterators.get(key) !== iterator) return;
                    this.pending.delete(key);
                    result.done ? this.iterators.delete(key) : this.resolved.set(key, result);
                    this.signal.resolve();
                }, error => {
                    if (this.iterators.get(key) !== iterator) return;
                    this.pending.delete(key);
                    this.iterators.delete(key);
                    this.signal.reject(error);
                }));
            }
        }
    }

    async wait(): Promise<void> {
        await this.signal.promise;
        this.signal = Promise.withResolvers();
    }

    take(): Map<K, IteratorResult<V>> {
        if (this.interrupted) return new Map();
        const result = this.resolved;
        this.resolved = new Map();
        return result;
    }

    /** Pulls the given keys (default all) and returns everything that resolved */
    async race(keys?: Iterable<K>): Promise<Map<K, IteratorResult<V>>> {
        this.pull(keys);
        await this.wait();
        return this.take();
    }

    get continue(): boolean {
        return !this.interrupted && this.iterators.size > 0;
    }

    /** Wakes a pending wait() with nothing, and stops the race: lets a generator awaiting it be returned */
    interrupt(): void {
        this.interrupted = true;
        this.signal.resolve();
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await Promise.all([...this.iterators.values()].map(it => it.return?.()));
        this.iterators.clear();
    }

    async* [Symbol.asyncIterator](): AsyncGenerator<Map<K, IteratorResult<V>>> {
        try {
            while (this.continue) {
                yield this.race();
            }
        } finally {
            await this[Symbol.asyncDispose]();
        }
    }
}


/**
 * A generator paused at an await can't take return() until that await settles, so a consumer's
 * `break` would hang while the race waits for a source. Interrupting the race first wakes it (as observe does).
 */
export function interruptible<T, G extends AsyncGenerator<T>>(generator: G, racer: AsyncIteratorRacer<any, any>): G {
    const original = generator.return.bind(generator);
    return Object.assign(generator, {
        return(value?: any) {
            racer.interrupt();
            return original(value);
        }
    });
}
