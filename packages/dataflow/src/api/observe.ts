/** @module
 * iterator function
 * */

/**
 * Converts a callback into an AsyncIterator that terminates on undefined.
 *
 * Subscribes immediately (init runs on creation, not on the first next()), so a value notified at any
 * time after observe() returns is never lost: values are coalesced and the latest one is always yielded.
 */
export function observe<T>(init: (notify: (t: T | undefined) => any) => any, value?: T, terminate: (t: T | undefined) => boolean = t => t === undefined): AsyncGenerator<T> {
    return new Observer(init, value, terminate) as unknown as AsyncGenerator<T>;
}

class Observer<T> implements AsyncIterableIterator<T> {
    private pending: boolean;
    private done = false;
    private signal = Promise.withResolvers<void>();
    private readonly dispose: unknown;

    constructor(init: (notify: (t: T | undefined) => any) => any,
                private value: T | undefined,
                private terminate: (t: T | undefined) => boolean) {
        this.pending = value !== undefined;
        this.dispose = init((v: T | undefined) => this.notify(v));
    }

    private notify(value: T | undefined): void {
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
                return {done: false, value: this.value!};
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
