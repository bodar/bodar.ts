import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {takeWhile, isTakeWhileTransducer} from "@bodar/totallylazy/transducers/TakeWhileTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

const lessThanFive = (n: number) => n < 5;

describe("TakeWhileTransducer", () => {
    const transducer = takeWhile(lessThanFive);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5, 6])), equals([1, 2, 3, 4]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles all elements matching", () => {
        assertThat(Array.from(transducer([1, 2, 3])), equals([1, 2, 3]));
    });

    it("handles first element not matching", () => {
        assertThat(Array.from(transducer([10, 1, 2])), equals([]));
    });

    it("stops at first non-matching element", () => {
        assertThat(Array.from(takeWhile<number>(n => n % 2 === 0)([2, 4, 6, 7, 8, 10])), equals([2, 4, 6]));
    });

    it("is inspectable", () => {
        assertThat(transducer.predicate, is(lessThanFive));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('takeWhile(n => n < 5)'));
    });
});

describe("isTakeWhileTransducer", () => {
    it("works", () => {
        assertThat(isTakeWhileTransducer(takeWhile(lessThanFive)), is(true));
        assertThat(isTakeWhileTransducer(() => 'false'), is(false));
    });
});
