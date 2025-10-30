import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {take, isTakeTransducer} from "@bodar/totallylazy/transducers/TakeTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("TakeTransducer", () => {
    const transducer = take<number>(3);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([1, 2, 3]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles iterables shorter than count", () => {
        assertThat(Array.from(transducer([1, 2])), equals([1, 2]));
    });

    it("handles zero count", () => {
        assertThat(Array.from(take<number>(0)([1, 2, 3])), equals([]));
    });

    it("handles negative count", () => {
        assertThat(Array.from(take<number>(-1)([1, 2, 3])), equals([]));
    });

    it("is inspectable", () => {
        assertThat(transducer.count, is(3));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('take(3)'));
    });
});

describe("isTakeTransducer", () => {
    it("works", () => {
        assertThat(isTakeTransducer(take(3)), is(true));
        assertThat(isTakeTransducer(() => 'false'), is(false));
    });
});
