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
});