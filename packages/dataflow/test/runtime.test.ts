import {describe, expect, test} from "bun:test";
import {runtime} from "../src/runtime.ts";

describe("runtime", async () => {
    test("throttle is a function", async () => {
        const r = runtime();
        expect(typeof r.throttle).toBe("function");
    });

    test("can turn on idle detection", async () => {
        const r = runtime({idle: true});
        expect(typeof r.idle).toBe("object");
    });

    test("throttles and times idleness on the global it is given, not globalThis", async () => {
        const frames: Function[] = [], timers: Function[] = [];
        const global = Object.assign(Object.create(globalThis), {
            requestAnimationFrame: (f: Function) => frames.push(f),
            setTimeout: (f: Function) => timers.push(f),
            clearTimeout: () => {}
        });
        void runtime({}, global).throttle();
        expect(frames.length).toBe(1);
        const tick = runtime({idle: true}, global).throttle();
        expect(frames.length).toBe(2);
        frames[1]();
        await tick;
        expect(timers.length).toBe(1);
    });
});