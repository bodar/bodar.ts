import {describe, expect, test} from "bun:test";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {end, observe} from "../../src/api/observe.ts";

export function observableSource<T>(...values: T[]): AsyncGenerator<T> & { disposed?: boolean } {
    const source = observe<T>((notify) => {
        values.forEach((value, index) => setTimeout(() => notify(value), index * 5));
        setTimeout(() => notify(end), values.length * 5);
        return () => Reflect.set(source, 'disposed', true);
    });
    return source;
}

describe("observe", () => {
    test("when we have finished observing, we clean up", async () => {
        const source = observableSource(1, 2);
        const result = await toPromiseArray(source);
        expect(result).toEqual([1, 2]);
        expect(source.disposed).toBe(true);
    });

    test("if we break early, we still clean up", async () => {
        const source = observableSource(1, 2);
        for await (const input of source) {
            expect(input).toEqual(1);
            break;
        }

        expect(source.disposed).toBe(true);
    });

    test("if we throw, we still clean up", async () => {
        const source = observableSource(1, 2);
        try {
            for await (const input of source) {
                expect(input).toEqual(1);
                throw new Error("we throw, we still clean up");
            }
        } catch (_) {
            // ignore
        }

        expect(source.disposed).toBe(true);
    });

    test("a value notified synchronously during init is only yielded once", async () => {
        const source = observe<number>((notify) => {
            notify(1);
            setTimeout(() => notify(2), 5);
            setTimeout(() => notify(end), 10);
        });
        expect(await toPromiseArray(source)).toEqual([1, 2]);
    });

    test("ending synchronously during init completes", async () => {
        const source = observe<number>((notify) => notify(end), 1);
        expect(await toPromiseArray(source)).toEqual([]);
    });

    test("undefined is a value: it is yielded and the stream goes on", async () => {
        const source = observe<number | undefined>((notify) => {
            setTimeout(() => notify(undefined), 0);
            setTimeout(() => notify(1), 5);
            setTimeout(() => notify(end), 10);
        });
        expect(await toPromiseArray(source)).toEqual([undefined, 1]);
    });

    test("an initial value is whatever was passed, undefined included; none when nothing (or end) was passed", async () => {
        const later = (notify: (n: number | typeof end) => void) => {
            setTimeout(() => notify(1), 0);
            setTimeout(() => notify(end), 5);
        };
        expect(await toPromiseArray(observe<number | undefined>(later, undefined))).toEqual([undefined, 1]);
        expect(await toPromiseArray(observe<number>(later))).toEqual([1]);
        expect(await toPromiseArray(observe<number>(later, end))).toEqual([1]);
    });

    test("a predicate can end the stream on a value of its own", async () => {
        const source = observe<number>((notify) => {
            setTimeout(() => notify(1), 0);
            setTimeout(() => notify(-1), 5);
        }, end, n => n === end || (n as number) < 0);
        expect(await toPromiseArray(source)).toEqual([1]);
    });

    test("end is a registered symbol, so separate copies of dataflow agree on it", () => {
        expect(end === Symbol.for('@bodar/dataflow/end')).toBe(true);
    });

    test("return() completes even when awaiting a promise that will never resolve", async () => {
        let disposed = false;
        const source = observe<number>(() => () => disposed = true);
        source.next(); // Start awaiting but don't await it
        await source.return(undefined as any);
        expect(disposed).toBe(true);
    });

    test("a value notified before the first next() is not lost", async () => {
        let notify!: (n: number) => void;
        const source = observe<number>((n) => { notify = n; }, 0);
        notify(1);
        expect((await source.next()).value).toBe(1);
    });

    test("disposing before the first next() still cleans up", async () => {
        let disposed = false;
        const source = observe<number>(() => () => disposed = true);
        await source.return(undefined as any);
        expect(disposed).toBe(true);
    });
});
