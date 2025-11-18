export class Mutation<T> extends EventTarget implements AsyncIterable<T> {
    constructor(private _value: T) {
        super();
    }

    get value(): T {
        return this._value;
    }

    set value(value: T) {
        this._value = value;
        this.dispatchEvent(new CustomEvent('change', {detail: {value: value}}));
    }

    [Symbol.asyncIterator]() {
        return eventListener(this, 'change', (ev: any) => ev.detail.value, this._value);
    }
}

export async function* eventListener<E extends Event, R>(source: EventTarget, eventType: string, eventHandler: (ev: E) => R, value: R): AsyncIterator<R> {
    let {promise, resolve} = Promise.withResolvers<R>();
    // Must close over the resolve variable to see it change
    source.addEventListener(eventType, (ev: any) => resolve(value = eventHandler(ev)))

    yield value;

    while (true) {
        await promise;
        // Must create new promise before yielding otherwise we miss the synchronous event dispatch
        ({promise, resolve} = Promise.withResolvers<R>());
        yield value;
    }
}