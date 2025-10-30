import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {dropWhile, isDropWhileTransducer} from "@bodar/totallylazy/transducers/DropWhileTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

const lessThanFive = (n: number) => n < 5;

describe("DropWhileTransducer", () => {
    const transducer = dropWhile(lessThanFive);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5, 6])), equals([5, 6]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles all elements matching", () => {
        assertThat(Array.from(transducer([1, 2, 3])), equals([]));
    });

    it("handles first element not matching", () => {
        assertThat(Array.from(transducer([10, 1, 2])), equals([10, 1, 2]));
    });

    it("yields all elements after first non-matching", () => {
        assertThat(Array.from(dropWhile<number>(n => n % 2 === 0)([2, 4, 6, 7, 8, 10])), equals([7, 8, 10]));
    });

    it("is inspectable", () => {
        assertThat(transducer.predicate, is(lessThanFive));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('dropWhile((n) => n < 5)'));
    });
});

describe("isDropWhileTransducer", () => {
    it("works", () => {
        assertThat(isDropWhileTransducer(dropWhile(lessThanFive)), is(true));
        assertThat(isDropWhileTransducer(() => 'false'), is(false));
    });
});
