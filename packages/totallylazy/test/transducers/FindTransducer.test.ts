import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {find, isFindTransducer} from "@bodar/totallylazy/transducers/FindTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("FindTransducer", () => {
    const isEven = (n: number) => n % 2 === 0;
    const isGreaterThan5 = (n: number) => n > 5;

    it("finds first matching element", () => {
        const transducer = find(isEven);
        assertThat(Array.from(transducer([1, 3, 5, 4, 6, 8])), equals([4]));
    });

    it("finds first element when multiple match", () => {
        const transducer = find(isGreaterThan5);
        assertThat(Array.from(transducer([1, 2, 10, 7, 9])), equals([10]));
    });

    it("returns empty when no match found", () => {
        const transducer = find(isEven);
        assertThat(Array.from(transducer([1, 3, 5, 7])), equals([]));
    });

    it("handles empty iterables", () => {
        const transducer = find(isEven);
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("is inspectable", () => {
        const transducer = find(isEven);
        assertThat(transducer.predicate, is(isEven));
    });

    it("is self describing", () => {
        const transducer = find(isEven);
        assertThat(transducer.toString(), is('find((n) => n % 2 === 0)'));
    });
});

describe("isFindTransducer", () => {
    it("works", () => {
        const isEven = (n: number) => n % 2 === 0;
        assertThat(isFindTransducer(find(isEven)), is(true));
        assertThat(isFindTransducer(() => 'false'), is(false));
    });
});
