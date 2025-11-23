/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import {isAsyncGeneratorFunction, isAsyncIterable, isAsyncIterator, isGeneratorFunction} from "./type-guards.ts";
import type {ThrottleStrategy} from "./Throttle.ts";
import {iterator} from "./Iterator.ts";
import type {Node} from "./Node.ts";

export interface EventData<T> {
    key: string;
    value: T;
}

/** A push / event based Node*/
export class PushNode<T> extends EventTarget implements Node<T>, AsyncIterable<T> {
    private lastInputs = new Map<string, any>();

    constructor(public key: string, public dependencies: PushNode<any>[], public fun: Function,
                private throttle: ThrottleStrategy) {
        super();
        this.lastInputs = new Map(this.dependencies.map(d => {
            d.addEventListener('change', (ev: any) => this.execute(ev.detail))
            return [d.key, undefined];
        }))
    }

    [Symbol.asyncIterator](): AsyncIterator<T> {
        return iterator<T>(notify => this.addEventListener('change', (ev: any) => notify(ev.detail.value)));
    }

    private lastResult?: any;

    execute(data: EventData<T>) {
        const oldValue = this.lastInputs.get(data.key);
        if (oldValue != data.value) {
            this.lastInputs.set(data.key, data.value);
            const currentValues = Array.from(this.lastInputs.values());
            if(currentValues.every(v => v !== undefined)) {
                this.lastResult = this.fun(...currentValues);
                this.processResult(this.lastResult)
            }
        }
    }

    async processResult(result: any): Promise<void> {
        const iterable = this.getIterable(result);
        if (iterable) {
            for await (const value of iterable) {
                // Throttle first so any synchronous events can arrive
                await this.throttle();
                this.dispatchEvent(new CustomEvent<EventData<T>>('change', {detail: {key: this.key, value}}));
            }
        } else {
            this.dispatchEvent(new CustomEvent<EventData<T>>('change', {detail: {key: this.key, value: result}}));
        }
    }

    getIterable(result: any): AsyncIterable<T> | undefined {
        if (isAsyncIterable(result)) {
            return result;
        } else if (isAsyncIterator(result)) {
            return {
                [Symbol.asyncIterator]() {
                    return result;
                }
            };
        } else if (isAsyncGeneratorFunction(result) && result.length === 0) {
            return {
                [Symbol.asyncIterator]() {
                    return result() as AsyncGenerator<T>;
                }
            };
        } else if (isGeneratorFunction(result) && result.length === 0) {
            const iterator = result() as Generator<T>;
            return {
                async* [Symbol.asyncIterator]() {
                    yield* {
                        [Symbol.iterator]() {
                            return iterator
                        }
                    }
                }
            };
        }
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PushNode<any>[], fun: Function, throttle: ThrottleStrategy): PushNode<T> {
    return new PushNode(key, dependencies, fun, throttle)
}