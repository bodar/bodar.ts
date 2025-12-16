import {describe, test} from "bun:test";
import {Idle} from "../src/Idle.ts";
import {Throttle} from "../src/Throttle.ts";
import {assertTrue} from "@bodar/totallylazy/asserts/assertThat.ts";

describe("Idle", () => {
    test("can detect when Throttle has not been called for a while", async () => {
        const start = Date.now();
        const idleMs = 1;
        const idle = new Idle(Throttle.microTasks(), idleMs);
        setTimeout(() => idle.strategy(), 0);
        await idle.fired();
        const end = Date.now();
        assertTrue(end - start > idleMs)
    });
});