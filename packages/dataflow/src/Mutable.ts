import {iterator} from "./Iterator.ts";

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

    [Symbol.asyncIterator]() {
        return iterator(notify => this.addEventListener('change', (ev: any) => notify(ev.detail)), this._value);
    }
}