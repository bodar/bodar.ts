import {describe, test} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {Throttle} from "../src/Throttle.ts";

describe("Throttle", () => {
    test("auto falls back to a clamped setTimeout when there is no requestAnimationFrame or setImmediate", async () => {
        const delays: number[] = [];
        const global = {setTimeout: (resolve: () => void, ms: number) => (delays.push(ms), resolve())};
        await Throttle.auto(global)();
        assertThat(delays, equals([0]));
    });
});
