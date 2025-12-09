/**
 * Allows multiple consumers to share an async iterator with back-pressure synchronization.
 *
 * All active consumers must call .next() before the underlying iterator advances.
 * No buffering - consumers are synchronized in lock-step.
 *
 * @module
 */

export type BackpressureStrategy = (ready: boolean[]) => boolean;

/** Backpressure is a collection of built-in strategies */
export class Backpressure {
    /** Backpressure is applied based on the slowest consumer */
    static slowest: BackpressureStrategy = (ready: boolean[]) => {
        return ready.every(status => status);
    }

    /** Backpressure is applied based on the fastest consumer */
    static fastest: BackpressureStrategy = (ready: boolean[]) => {
        return ready.some(status => status);
    }
}

/** Shares an async iterator across multiple consumers with backpressure synchronization */
export class SharedAsyncIterable<T> implements AsyncIterable<T> {
    private iterator?: AsyncIterator<T>;
    private consumers: Set<SharedAsyncIterator<T>> = new Set();
    private pending = false;

    constructor(private iterable: AsyncIterable<T>, private backpressure: BackpressureStrategy) {
        this.updateConsumers = this.updateConsumers.bind(this)
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        if (!this.iterator) this.iterator = this.iterable[Symbol.asyncIterator]();
        const iterator = new SharedAsyncIterator<T>(this)
        this.consumers.add(iterator);
        return iterator;
    }

    reset(): void {
        this.iterator = undefined;
        this.consumers.clear();
        this.pending = false;
    }

    get ready(): boolean {
        return this.backpressure(Array.from(this.consumers).map(v => v.ready));
    }

    sendNext(): void {
        if (this.pending) return;
        this.pending = true;
        this.iterator!.next().then(this.updateConsumers);
    }

    updateConsumers(result: IteratorResult<T>) {
        this.pending = false;
        for (const consumer of this.consumers) {
            consumer.sendNext(result);
        }
        if (result.done) this.reset();
    }
}

class SharedAsyncIterator<T> implements AsyncIterator<T> {
    private resolve?: (value: (PromiseLike<IteratorResult<T, any>> | IteratorResult<T, any>)) => void;
    private result?: IteratorResult<T>

    constructor(private controller: SharedAsyncIterable<T>) {
    }

    get ready(): boolean {
        return !!this.resolve;
    }

    reset(): void {
        this.resolve = undefined;
        this.result = undefined;
    }

    async next(): Promise<IteratorResult<T, any>> {
        if (this.result) {
            try {
                return this.result;
            } finally {
                this.reset();
            }
        }
        const {promise, resolve} = Promise.withResolvers<IteratorResult<T, any>>();
        this.resolve = resolve;
        if (this.controller.ready) {
            // Do NOT await this
            this.controller.sendNext();
        }
        return promise;
    }

    sendNext(result: IteratorResult<T>): void {
        if (this.resolve) {
            this.resolve!(result);
            this.reset();
        } else {
            this.result = result;
        }
    }
}
