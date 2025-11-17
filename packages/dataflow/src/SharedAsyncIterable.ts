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

export type StrategyChecker = (ready: boolean[]) => boolean;

export class Strategy {
    static backpressure: StrategyChecker = (ready: boolean[]) => {
        return ready.every(status => status);
    }

    static latest: StrategyChecker = (ready: boolean[]) => {
        return ready.some(status => status);
    }
}

/** Shares an async iterator across multiple consumers with back-pressure synchronization */
export class SharedAsyncIterable<T> implements AsyncIterable<T> {
    iterator?: AsyncIterator<T>;
    consumers = new Set<SharedAsyncIterator<T>>();

    constructor(private iterable: AsyncIterable<T>, private strategy: StrategyChecker) {
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

    get ready() {
        return this.strategy(Array.from(this.consumers).map(v => v.ready));
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
    private result?: IteratorResult<T>

    constructor(private controller: SharedAsyncIterable<T>) {
    }

    get ready(): boolean {
        return !!this.resolve;
    }

    async next(): Promise<IteratorResult<T, any>> {
        if (this.result) {
            try {
                return this.result;
            } finally {
                this.result = undefined;
            }
        }
        return new Promise<IteratorResult<T, any>>((resolve) => {
            this.resolve = resolve;
            if (this.controller.ready) this.controller.sendNext();
        })
    }

    sendNext(result: IteratorResult<T>) {
        if (this.resolve) {
            this.resolve!(result);
            this.resolve = undefined;
        } else {
            this.result = result;
        }
    }
}
