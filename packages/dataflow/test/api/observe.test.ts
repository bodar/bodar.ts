import {describe, expect, test} from "bun:test";
import {toPromiseArray} from "@bodar/totallylazy/collections/Array.ts";
import {observe} from "../../src/api/observe.ts";

export function observableSource<T>(...values: T[]): AsyncGenerator<T> & { disposed?: boolean } {
    const source = observe<T>((notify) => {
        values.forEach((value, index) => setTimeout(() => notify(value), index * 5));
        setTimeout(() => notify(undefined), values.length * 5);
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
});