/** @module
 * iterator function
 * */

/** Notify this to end an {@link observe} stream; every other value, `undefined` included, is yielded. Registered, so every copy of dataflow agrees on it */
export const end: unique symbol = Symbol.for('@bodar/dataflow/end');

/**
 * Converts a callback into an AsyncIterator that ends when `terminate` says so (by default on
 * `notify(end)`) or when its consumer stops. Every other value, `undefined` included, is yielded.
 *
 * Subscribes immediately (init runs on creation, not on the first next()), so a value notified at any
 * time after observe() returns is never lost: values are coalesced and the latest one is always yielded.
 * The stream starts with `value` when one is passed (`undefined` included) unless it is `end`,
 * otherwise with the first notify.
 */
export function observe<T>(init: (notify: (t: T | typeof end) => any) => any,
                           value?: T | typeof end,
                           terminate: (t: T | typeof end) => boolean = t => t === end): AsyncGenerator<T> {
    // Not a default parameter: those also replace an explicit undefined
    return new Observer(init, arguments.length > 1 ? value as T | typeof end : end, terminate) as unknown as AsyncGenerator<T>;
}

class Observer<T> implements AsyncIterableIterator<T> {
    private pending: boolean;
    private done = false;
    private signal = Promise.withResolvers<void>();
    private readonly dispose: unknown;

    constructor(init: (notify: (t: T | typeof end) => any) => any,
                private value: T | typeof end,
                private terminate: (t: T | typeof end) => boolean) {
        this.pending = value !== end;
        this.dispose = init((v: T | typeof end) => this.notify(v));
    }

    private notify(value: T | typeof end): void {
        if (this.done) return;
        this.value = value;
        this.pending = true;
        this.signal.resolve();
    }

    async next(): Promise<IteratorResult<T>> {
        while (!this.done) {
            if (this.pending) {
                this.pending = false;
                if (this.terminate(this.value)) break;
                return {done: false, value: this.value as T};
            }
            await this.signal.promise;
            this.signal = Promise.withResolvers<void>();
        }
        return this.return();
    }

    async return(value?: any): Promise<IteratorResult<T>> {
        if (!this.done) {
            this.done = true;
            this.signal.resolve(); // release a pending next()
            if (typeof this.dispose === 'function' && this.dispose.length === 0) await this.dispose();
        }
        return {done: true, value};
    }

    async throw(error?: any): Promise<IteratorResult<T>> {
        await this.return();
        throw error;
    }

    [Symbol.asyncIterator](): this {
        return this;
    }

    async [Symbol.asyncDispose](): Promise<void> {
        await this.return();
    }
}
