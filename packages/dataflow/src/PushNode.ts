/**
 * Reactive nodes that combine dependency streams and yield computed values
 * @module
 */
import type {ThrottleStrategy} from "./Throttle.ts";
import type {Node} from "./Node.ts";
import {toAsyncIterable} from "./toAsyncIterable.ts";

export interface InputUpdate<T> {
    key: string;
    value: T | undefined;
    done: boolean;
}

/** A push / event based Node*/
export class PushNode<T> extends EventTarget implements Node<T>, AsyncIterable<T> {
    private inputs = new Map<string, InputUpdate<T>>();
    private value: any;

    // @ts-ignore
    constructor(public key: string, public dependencies: PushNode<any>[], public fun: Function, private throttle: ThrottleStrategy) {
        super();
        this.dependencies.forEach(d => d.addEventListener('change', (ev: any) => this.changed(ev.detail)))
    }

    async* [Symbol.asyncIterator](): AsyncIterator<T> {
        let {promise, resolve} = Promise.withResolvers<any>();
        // Must close over the resolve variable to see it change
        this.addEventListener("change", (ev: any) => resolve(ev.detail));

        while (true) {
            const update = await promise;

            if (update.done) break;
            // Must create new promise before yielding otherwise we miss any synchronous notifications
            ({promise, resolve} = Promise.withResolvers<any>());

            yield update.value;
        }
    }

    addEventListener(type: string, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean) {
        super.addEventListener(type, callback, options);
        this.execute(false);
    }

    async changed(update: InputUpdate<T>) {
        const lastUpdate = this.inputs.get(update.key);
        if (update.done && lastUpdate) {
            lastUpdate.done = true;
        } else if (update.value !== lastUpdate?.value) {
            this.inputs.set(update.key, update);
            await this.execute(true);
        }
    }

    async execute(update: boolean) {
        if (update || this.value === undefined) {
            const newValues = Array.from(this.inputs.values().map(u => u.value));
            this.value = this.fun(...newValues);
        }
        await this.processResult()
    }

    async processResult(): Promise<void> {
        const iterable = toAsyncIterable<T>(this.value);
        if (iterable) {
            for await (const value of iterable) {
                // await this.throttle();
                // TODO support cancelling on new input
                this.fireEvent(value, false);
            }
            this.fireEvent(undefined, this.inputs.values().every(u => u.done));
        } else {
            this.fireEvent(this.value, false);
            const done = this.inputs.values().every(u => u.done);
            if (done) this.fireEvent(undefined, done);
        }
    }

    private fireEvent(value: T | undefined, done: boolean) {
        this.dispatchEvent(new CustomEvent<InputUpdate<T>>('change', {
            detail: {
                key: this.key,
                value,
                done
            }
        }));
    }
}

/** Factory function to create a new reactive node */
export function node<T>(key: string, dependencies: PushNode<any>[], fun: Function, throttle: ThrottleStrategy): PushNode<T> {
    return new PushNode(key, dependencies, fun, throttle)
}