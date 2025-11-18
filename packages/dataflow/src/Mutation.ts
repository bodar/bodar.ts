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

    async* [Symbol.asyncIterator](): AsyncIterator<T> {
        let {promise, resolve} = Promise.withResolvers();
        // Must close over the resolve variable to see it change
        this.addEventListener('change', () => resolve())

        yield this._value;

        while (true) {
            await promise;
            // Must create new promise before yielding otherwise we miss the synchronous event dispatch
            ({promise, resolve} = Promise.withResolvers());
            yield this._value;
        }
    }
}