/**
 * Races multiple async iterators, yielding results as they resolve.
 * Benefits over Promise.race:
 *  1. No memory leaks
 *  2. Races multiple at a time
 *  3. Allows micro tasks to settle in same iteration (solves diamond shaped dependencies)
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
        this.iterators.set(key, iterator);
        return this;
    }

    pull(): void {
        for (const [key, iterator] of this.iterators) {
            if (!this.pending.has(key) && !this.resolved.has(key)) {
                this.pending.set(key, iterator.next().then(result => {
                    this.pending.delete(key);
                    result.done ? this.iterators.delete(key) : this.resolved.set(key, result);
                    this.signal.resolve();
                }));
            }
        }
    }

    async wait(): Promise<void> {
        await Promise.all([this.signal.promise, Promise.resolve()]);
        this.signal = Promise.withResolvers();
    }

    take(): Map<K, IteratorResult<V>> {
        const result = this.resolved;
        this.resolved = new Map();
        return result;
    }

    async race(): Promise<Map<K, IteratorResult<V>>> {
        this.pull();
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

    async *[Symbol.asyncIterator](): AsyncGenerator<Map<K, IteratorResult<V>>> {
        try {
            while (this.continue) {
                yield this.race();
            }
        } finally {
            await this[Symbol.asyncDispose]();
        }
    }
}
