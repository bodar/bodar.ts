/**
 * Class that allows one to detect when reactive rendering is idle
 * @module
 */

import type {ThrottleStrategy} from "../Throttle.ts";

export class Idle {
    private id: number = 0;
    /** Ticks requested but not yet resolved: never idle while one is pending */
    private pending = 0;
    // @ts-ignore
    private promise: Promise<void>;
    // @ts-ignore
    private resolve: Function;

    constructor(private _strategy: ThrottleStrategy, private ms: number = 2, private global: any = globalThis) {
        this.resetPromise();
    }

    get strategy(): ThrottleStrategy {
        return () => {
            this.pending++;
            this.clearTimer();
            return this._strategy().finally(() => {
                // Quiet starts when the last pending tick resolves, not when it was requested
                if (--this.pending === 0) this.resetTimer();
            });
        }
    }

    fired(): Promise<void> {
        return this.promise
    }

    private clearTimer(): void {
        if (this.id) {
            this.global.clearTimeout(this.id);
            this.id = 0;
        }
    }

    private resetTimer(): void {
        this.clearTimer();
        this.id = this.global.setTimeout(() => {
            const resolve = this.resolve;
            this.resetPromise();
            resolve();
        }, this.ms);
    }

    private resetPromise(): void {
        ({promise: this.promise, resolve: this.resolve} = Promise.withResolvers())
    }
}