import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {identity, isIdentityTransducer} from "@bodar/totallylazy/transducers/IdentityTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("IdentityTransducer", () => {
    const transducer = identity<number>();

    it("returns elements unchanged", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([1, 2, 3, 4, 5]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([42])), equals([42]));
    });

    it("works with different types", () => {
        const stringTransducer = identity<string>();
        assertThat(Array.from(stringTransducer(["a", "b", "c"])), equals(["a", "b", "c"]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('identity()'));
    });
});

describe("isIdentityTransducer", () => {
    it("works", () => {
        assertThat(isIdentityTransducer(identity()), is(true));
        assertThat(isIdentityTransducer(() => 'false'), is(false));
    });
});
