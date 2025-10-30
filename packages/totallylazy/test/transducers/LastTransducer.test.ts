import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {last, isLastTransducer} from "@bodar/totallylazy/transducers/LastTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("LastTransducer", () => {
    const transducer = last<number>();

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([5]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([42])), equals([42]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('last()'));
    });
});

describe("isLastTransducer", () => {
    it("works", () => {
        assertThat(isLastTransducer(last()), is(true));
        assertThat(isLastTransducer(() => 'false'), is(false));
    });
});
