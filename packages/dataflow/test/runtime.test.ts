import {describe, expect, test} from "bun:test";
import {runtime} from "../src/runtime.ts";

describe("runtime", async () => {
    test("chains dependency calls up to global", async () => {
        const r = runtime({
            get document() {
                return 'called'
            }
        });

        expect(r.document).toBe("called");
    });

    test("throttle is a function", async () => {
        const r = runtime();
        expect(typeof r.throttle).toBe("function");
    });

    test.only("can turn on idle detection", async () => {
        const r = runtime(globalThis, true);
        expect(typeof r.idle).toBe("object");
    });
});