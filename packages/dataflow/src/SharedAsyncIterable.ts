/**
 * Allows multiple consumers to share an async iterator with back-pressure synchronization.
 *
 * All active consumers must call .next() before the underlying iterator advances.
 * No buffering - consumers are synchronized in lock-step.
 *
 * Inspired by Highland.js fork() pattern.
 *
 * @module
 */

/** Shares an async iterator across multiple consumers with back-pressure synchronization */
export class SharedAsyncIterable<T> implements AsyncIterable<T> {
    iterator?: AsyncIterator<T>;
    consumers = new Set<SharedAsyncIterator<T>>();

    constructor(private iterable: AsyncIterable<T>) {
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        if (!this.iterator) this.iterator = this.iterable[Symbol.asyncIterator]();
        const iterator = new SharedAsyncIterator<T>(this)
        this.consumers.add(iterator);
        return iterator;
    }

    reset() {
        this.iterator = undefined;
        this.consumers.clear();
    }

    allReady() {
        return Array.from(this.consumers).every((value) => value.ready);
    }

    async sendNext() {
        const result = await this.iterator!.next();
        for (const consumer of this.consumers) {
            consumer.sendNext(result);
        }
        if (result.done) this.reset();
    }
}

class SharedAsyncIterator<T> implements AsyncIterator<T> {
    private resolve?: (value: (PromiseLike<IteratorResult<T, any>> | IteratorResult<T, any>)) => void;
    private done = false;

    constructor(private iterable: SharedAsyncIterable<T>) {
    }

    get ready(): boolean {
        return !!this.resolve;
    }

    async next(): Promise<IteratorResult<T, any>> {
        if (this.done) return {done: true, value: undefined}
        return new Promise<IteratorResult<T, any>>((resolve) => {
            this.resolve = resolve;
            if (this.iterable.allReady()) this.iterable.sendNext();
        })
    }

    sendNext(result: IteratorResult<T>) {
        this.resolve!(result);
        this.resolve = undefined;
        this.done = !!result.done;
    }
}
