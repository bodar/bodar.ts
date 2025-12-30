export class Raw<T> implements AsyncIterable<T> {
    constructor(public readonly value: T) {
    }

    async* [Symbol.asyncIterator](): AsyncIterator<T, any, any> {
        yield this.value;
    }
}

export function raw<T>(value: T): Raw<T> {
    return new Raw<T>(value);
}