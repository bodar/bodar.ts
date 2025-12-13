import {isAsyncGeneratorFunction, isAsyncIterable, isAsyncIterator, isGeneratorFunction} from "./type-guards.ts";

export function toAsyncIterable<T>(value: any): AsyncIterable<T> {
    if (isAsyncIterable(value)) {
        return value;
    } else if (isAsyncIterator(value)) {
        return {
            [Symbol.asyncIterator]() {
                return value;
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