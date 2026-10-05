import {describe, expect, test} from "bun:test";
import {Idle} from "../../src/testing/Idle.ts";
import {Throttle} from "../../src/Throttle.ts";

describe("Idle", () => {
    test("can detect when Throttle has not been called for a while", async () => {
        const start = Date.now();
        const idleMs = 1;
        const idle = new Idle(Throttle.microTasks(), idleMs);
        setTimeout(() => idle.strategy(), 0);
        await idle.fired();
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(idleMs)
    });

    test("is not idle while a requested tick is still pending, however long it takes", async () => {
        const frames: Function[] = [];
        const frame = () => new Promise(resolve => frames.push(resolve));
        const idle = new Idle(frame, 2);
        let fired = false;
        idle.fired().then(() => fired = true);
        const tick = idle.strategy();
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(fired).toBe(false);
        frames.shift()!();
        await tick;
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(fired).toBe(true);
    });
});