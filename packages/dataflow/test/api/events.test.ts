import {describe, expect, test} from "bun:test";
import {events} from "../../src/api/events.ts";

describe("events", () => {
    test("an event dispatched between events() and the first next() is not lost", async () => {
        const target = new EventTarget();
        const iterator = events(target, 'x', (e: CustomEvent) => e.detail, 0);
        target.dispatchEvent(new CustomEvent('x', {detail: 1}));
        expect((await iterator.next()).value).toBe(1);
    });

    test("a value function returning undefined yields undefined and the stream goes on", async () => {
        const target = new EventTarget();
        // Like reading .value from an element that has none (linkedom's <button>)
        const iterator = events(target, 'x', (e: any) => e.value);
        target.dispatchEvent(new Event('x'));
        const first = await iterator.next();
        expect(first.done).toBe(false);
        expect(first.value).toBe(undefined);
        target.dispatchEvent(Object.assign(new Event('x'), {value: 2}));
        expect((await iterator.next()).value).toBe(2);
    });
});
