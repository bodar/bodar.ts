export class Mutation<T> extends EventTarget implements AsyncIterable<T> {
    constructor(private _value: T) {
        super();
    }

    get value(): T {
        return this._value;
    }

    set value(value: T) {
        this._value = value;
        this.dispatchEvent(new CustomEvent<T>('change', {detail: value}));
    }

    [Symbol.asyncIterator]() {
        return latest(listener => this.addEventListener('change', listener as EventListener),
            (ev: CustomEvent<T>) => ev.detail,
            this._value);
    }
}

export async function* latest<E, R>(init: (listener: (e: E) => any) => any, handler: (e: E) => R, value: R): AsyncIterator<R> {
    let {promise, resolve} = Promise.withResolvers<R>();
    // Must close over the resolve variable to see it change
    init((v => resolve(value = handler(v))))

    yield value;

    while (true) {
        await promise;
        // Must create new promise before yielding otherwise we miss the synchronous event dispatch
        ({promise, resolve} = Promise.withResolvers<R>());
        yield value!;
    }
}