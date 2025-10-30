import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {first, isFirstTransducer} from "@bodar/totallylazy/transducers/FirstTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("FirstTransducer", () => {
    const transducer = first<number>();

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([1]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([42])), equals([42]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('first()'));
    });
});

describe("isFirstTransducer", () => {
    it("works", () => {
        assertThat(isFirstTransducer(first()), is(true));
        assertThat(isFirstTransducer(() => 'false'), is(false));
    });
});
