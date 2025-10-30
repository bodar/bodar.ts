import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {sort, isSortTransducer} from "@bodar/totallylazy/transducers/SortTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import type {Comparator} from "@bodar/totallylazy/comparators/Comparator.ts";

describe("SortTransducer", () => {
    const ascending: Comparator<number> = Object.assign(
        (a: number, b: number) => a - b,
        {toString: () => '(a, b) => a - b'}
    );
    const descending: Comparator<number> = Object.assign(
        (a: number, b: number) => b - a,
        {toString: () => '(a, b) => b - a'}
    );

    it("sorts numbers in ascending order", () => {
        const transducer = sort(ascending);
        assertThat(Array.from(transducer([3, 1, 4, 1, 5, 9, 2, 6])), equals([1, 1, 2, 3, 4, 5, 6, 9]));
    });

    it("sorts numbers in descending order", () => {
        const transducer = sort(descending);
        assertThat(Array.from(transducer([3, 1, 4, 1, 5, 9, 2, 6])), equals([9, 6, 5, 4, 3, 2, 1, 1]));
    });

    it("handles empty iterables", () => {
        const transducer = sort(ascending);
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        const transducer = sort(ascending);
        assertThat(Array.from(transducer([42])), equals([42]));
    });

    it("is inspectable", () => {
        const transducer = sort(ascending);
        assertThat(transducer.comparator, is(ascending));
    });

    it("is self describing", () => {
        const transducer = sort(ascending);
        assertThat(transducer.toString(), is('sort((a, b) => a - b)'));
    });
});

describe("isSortTransducer", () => {
    it("works", () => {
        const ascending: Comparator<number> = Object.assign(
            (a: number, b: number) => a - b,
            {toString: () => '(a, b) => a - b'}
        );
        assertThat(isSortTransducer(sort(ascending)), is(true));
        assertThat(isSortTransducer(() => 'false'), is(false));
    });
});
