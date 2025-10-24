import {describe, expect, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("assertThat", () => {
    it('does not throw when predicate matches', () => {
        assertThat(2, is(2));
    });

    it('does throw when predicate does not match', () => {
        expect(() => assertThat(2, is(3))).toThrow(new Error("assertThat(2, is(3));"));
    });
});
