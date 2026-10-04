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
        return this.iterators.size > 0;
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
