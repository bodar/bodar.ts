import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {dedupe, isDedupeTransducer} from "@bodar/totallylazy/transducers/DedupeTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("DedupeTransducer", () => {
    const transducer = dedupe<number>();

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 1, 2, 2, 3, 3])), equals([1, 2, 3]));
    });

    it("removes consecutive duplicates", () => {
        assertThat(Array.from(transducer([1, 1, 1, 2, 2, 3, 1, 1])), equals([1, 2, 3, 1]));
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

    it("is self describing", () => {
        assertThat(transducer.toString(), is('dedupe()'));
    });
});

describe("isDedupeTransducer", () => {
    it("works", () => {
        assertThat(isDedupeTransducer(dedupe()), is(true));
        assertThat(isDedupeTransducer(() => 'false'), is(false));
    });
});
