import {isAsyncGeneratorFunction, isAsyncIterable, isIterator, isGeneratorFunction} from "./type-guards.ts";

export function toAsyncIterable<T>(value: any): AsyncIterable<T> {
    if (isAsyncIterable(value)) {
        return value;
    } else if (isIterator(value)) {
        return {
            [Symbol.asyncIterator]() {
                return toAsyncIterator(value)
            }
        };
    } else if (isAsyncGeneratorFunction(value) && value.length === 0) {
        return {
            [Symbol.asyncIterator]() {
                return value() as AsyncGenerator<T>;
            }
        };
    } else if (isGeneratorFunction(value) && value.length === 0) {
        return {
            async* [Symbol.asyncIterator]() {
                yield* {
                    [Symbol.iterator]() {
                        return value() as Generator<T>
                    }
                }
            }
        };
    } else {
        return {
            async* [Symbol.asyncIterator]() {
                yield value;
            }
        }
    }
}

function toAsyncIterator<T>(iterator: (AsyncIterator<T> | Iterator<T>)): AsyncIterator<T> {
    return {
        next(...args) {
            return Promise.resolve(iterator.next(...args));
        },
        return(value) {
            return Promise.resolve(iterator.return?.(value) ?? {done: true, value});
        },
        throw(e) {
            return Promise.resolve(iterator.throw?.(e) ?? Promise.reject(e));
        }
    };
}