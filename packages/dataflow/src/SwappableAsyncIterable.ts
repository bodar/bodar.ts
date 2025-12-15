export class SwappableAsyncIterable<T> implements AsyncIterable<T> {
    private consumers: Set<SwappableAsyncIterator<T>> = new Set();

    constructor(private iterable: AsyncIterable<T>) {
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        const iterator = new SwappableAsyncIterator<T>(this.iterable[Symbol.asyncIterator]())
        this.consumers.add(iterator);
        return iterator;
    }

    swap(iterable: AsyncIterable<T>): void {
        this.iterable = iterable;
        this.consumers.forEach(consumer => consumer.swap(this.iterable[Symbol.asyncIterator]()))
    }
}

export class SwappableAsyncIterator<T> implements AsyncIterator<T> {
    private promise?: SwappablePromise<any>;

    constructor(private iterator: AsyncIterator<T>) {
    }

    swap(iterator: AsyncIterator<T>) {
        if (this.promise && !this.promise.settled) this.promise?.swap(iterator.next())
        this.iterator.return?.();
        this.iterator = iterator;
    }

    next(...args: any[]): Promise<IteratorResult<T>> {
        // @ts-ignore
        return this.promise = new SwappablePromise(this.iterator.next(...args));
    }

    async return(value?: any): Promise<IteratorResult<T>> {
        return this.iterator.return?.(value) ?? {done: true, value};
    }

    throw(e?: any): Promise<IteratorResult<T>> {
        return this.iterator.throw?.(e) ?? Promise.reject(e)
    }
}

type Resolved<T, TResult1 = T> =
    ((value: T) => PromiseLike<TResult1> | TResult1) | undefined | null;

type Rejected<TResult2 = never> =
    ((reason: any) => PromiseLike<TResult2> | TResult2) | undefined | null;

export class SwappablePromise<T> implements PromiseLike<T> {
    private promise: Promise<T>;
    private resolve!: (value: T | PromiseLike<T>) => void;
    private reject!: (reason?: any) => void;
    public settled = false;
    private version = 0;

    constructor(initial: PromiseLike<T>) {
        ({promise: this.promise, resolve: this.resolve, reject: this.reject} = Promise.withResolvers<T>())
        this.swap(initial);
    }

    then<TResult1 = T, TResult2 = never>(onFulfilled?: Resolved<T, TResult1>, onRejected?: Rejected<TResult2>): PromiseLike<TResult1 | TResult2> {
        return this.promise.then(onFulfilled, onRejected);
    }

    swap(promise: PromiseLike<T>) {
        if (this.settled) return;

        const version = ++this.version;

        promise.then(
            value => {
                if (this.settled || version !== this.version) return;
                this.settled = true;
                this.resolve(value);
            },
            reason => {
                if (this.settled || version !== this.version) return;
                this.settled = true;
                this.reject(reason);
            }
        );
    }
}