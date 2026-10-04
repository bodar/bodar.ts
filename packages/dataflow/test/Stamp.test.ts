import {describe, test} from "bun:test";
import {lagging, merge} from "../src/Stamp.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

const a = {}, b = {}, c = {};

describe("Stamp", () => {
    test("merge keeps the highest count for each node", () => {
        const merged = merge([new Map([[a, 1], [b, 3]]), new Map([[a, 2], [c, 1]])]);
        assertThat(Array.from(merged), equals([[a, 2], [b, 3], [c, 1]]));
    });

    test("stamps that agree on every shared node are consistent", () => {
        assertThat(Array.from(lagging([new Map([[a, 2], [b, 1]]), new Map([[a, 2], [c, 5]])])), equals([]));
    });

    test("a stamp behind on a shared node is lagging", () => {
        assertThat(Array.from(lagging([new Map([[a, 1], [b, 1]]), new Map([[a, 2]]), new Map([[a, 2]])])), equals([0]));
    });

    test("stamps that share no node never lag each other", () => {
        assertThat(Array.from(lagging([new Map([[a, 1]]), new Map([[b, 9]])])), equals([]));
    });

    test("missing stamps are ignored", () => {
        assertThat(Array.from(lagging([undefined, new Map([[a, 1]])])), equals([]));
    });
});
