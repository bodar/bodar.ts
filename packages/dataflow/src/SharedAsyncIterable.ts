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

interface ConsumerState {
    id: number;
    ready: boolean;
    resolve?: (result: IteratorResult<any>) => void;
}

/** Shares an async iterator across multiple consumers with back-pressure synchronization */
export class SharedAsyncIterable<T> implements AsyncIterable<T>{
    private iterator?: AsyncIterator<T>;
    private consumers = new Map<number, ConsumerState>();
    private nextConsumerId = 0;
    private done = false;

    constructor(private iterable: AsyncIterable<T>) {
    }


    [Symbol.asyncIterator](): AsyncIterator<T> {
        if (!this.iterator) {
            this.iterator = this.iterable[Symbol.asyncIterator]();
            this.nextConsumerId = 0;
            this.done = false;
        }

        const consumerId = this.nextConsumerId++;
        this.consumers.set(consumerId, { id: consumerId, ready: false });

        return {
            next: async (): Promise<IteratorResult<T>> => {
                // If already done, return done immediately
                if (this.done) {
                    return {value: undefined, done: true};
                }

                return new Promise<IteratorResult<T>>((resolve) => {
                    const consumer = this.consumers.get(consumerId)!;
                    consumer.ready = true;
                    consumer.resolve = resolve;

                    // Check if all consumers are ready
                    this.checkAllReady();
                });
            },

            return: async (): Promise<IteratorResult<T>> => {
                // Remove this consumer
                this.consumers.delete(consumerId);

                // If no more consumers, reset source
                if (this.consumers.size === 0) {
                    if (this.iterator && this.iterator.return) {
                        await this.iterator.return();
                    }
                    this.iterator = null;
                    this.done = false; // Reset done state for fresh start
                }

                return {value: undefined, done: true} as IteratorResult<T>;
            }
        };
    }

    private async checkAllReady(): Promise<void> {
        // Check if all consumers are ready
        const allReady = Array.from(this.consumers.values()).every(c => c.ready);

        if (!allReady || this.consumers.size === 0) {
            return;
        }

        // All consumers ready - advance the source
        const result = await this.iterator!.next();

        if (result.done) {
            this.done = true;
        }

        // Normalize result to always have value field
        const normalizedResult: IteratorResult<T> = result.done
            ? {value: undefined, done: true} as IteratorResult<T>
            : { value: result.value, done: false };

        // Resolve all waiting consumers with the same result
        for (const consumer of this.consumers.values()) {
            if (consumer.resolve) {
                consumer.resolve(normalizedResult);
                consumer.ready = false;
                consumer.resolve = undefined;
            }
        }
    }
}
