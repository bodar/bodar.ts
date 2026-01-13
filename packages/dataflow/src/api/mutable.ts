import {events} from "./events.ts";

/** A Mutable value that is AsyncIterable and an fires a 'change' event */
export class Mutable<T> extends EventTarget implements AsyncIterable<T> {
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

    update(fun: (t: T) => T): this {
        this.value = fun(this.value);
        return this;
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return events(this, 'change', () => this._value, this._value);
    }
}

export function mutable<T>(value: T): Mutable<T> {
    return new Mutable<T>(value);
}