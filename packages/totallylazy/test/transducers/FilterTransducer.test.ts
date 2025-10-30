import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {filter, isFilterTransducer} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {Transducer} from "@bodar/totallylazy/transducers/Transducer.ts";

const even = (x: number) => x % 2 === 0;
const transducer = filter(even);

describe("FilterTransducer", () => {
    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([2, 4]));
    });

    it("is inspectable", () => {
        assertThat(transducer.predicate, is(even));
    });

    it("has transducer type", () => {
        assertThat(transducer[Transducer.type], is('filter'));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('filter((x) => x % 2 === 0)'));
    });
});

describe("isFilterTransducer", () => {
    it("works", () => {
        assertThat(isFilterTransducer(transducer), is(true));
        assertThat(isFilterTransducer(() => false), is(false));
    });
});