import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {unique, isUniqueTransducer} from "@bodar/totallylazy/transducers/UniqueTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("UniqueTransducer", () => {
    const transducer = unique<number>();

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 2, 1])), equals([1, 2, 3]));
    });

    it("removes all duplicates", () => {
        assertThat(Array.from(transducer([1, 2, 1, 3, 2, 1])), equals([1, 2, 3]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([1])), equals([1]));
    });

    it("handles no duplicates", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4])), equals([1, 2, 3, 4]));
    });

    it("handles all duplicates", () => {
        assertThat(Array.from(transducer([1, 1, 1, 1])), equals([1]));
    });

    it("preserves first occurrence order", () => {
        assertThat(Array.from(transducer([3, 1, 2, 1, 3, 2])), equals([3, 1, 2]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('unique()'));
    });
});

describe("isUniqueTransducer", () => {
    it("works", () => {
        assertThat(isUniqueTransducer(unique()), is(true));
        assertThat(isUniqueTransducer(() => 'false'), is(false));
    });
});
