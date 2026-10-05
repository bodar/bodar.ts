import {describe, expect, test} from "bun:test";
import {events} from "../../src/api/events.ts";

describe("events", () => {
    test("an event dispatched between events() and the first next() is not lost", async () => {
        const target = new EventTarget();
        const iterator = events(target, 'x', (e: CustomEvent) => e.detail, 0);
        target.dispatchEvent(new CustomEvent('x', {detail: 1}));
        expect((await iterator.next()).value).toBe(1);
    });
});
