import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {reduce, isReduceTransducer} from "@bodar/totallylazy/transducers/ReduceTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("ReduceTransducer", () => {
    const add = (acc: number, val: number) => acc + val;
    const transducer = reduce(add, 0);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3])), equals([6]));
    });

    it("yields only final result", () => {
        assertThat(Array.from(reduce(add, 10)([1, 2, 3])), equals([16]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([0]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([5])), equals([5]));
    });

    it("works with different types", () => {
        const concat = (acc: string, val: number) => acc + val;
        const stringTransducer = reduce(concat, "");
        assertThat(Array.from(stringTransducer([1, 2, 3])), equals(["123"]));
    });

    it("works for multiplication", () => {
        const multiply = (acc: number, val: number) => acc * val;
        assertThat(Array.from(reduce(multiply, 1)([2, 3, 4])), equals([24]));
    });

    it("is inspectable", () => {
        assertThat(transducer.reducer, is(add));
        assertThat(transducer.seed, is(0));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('reduce((acc, val) => acc + val, 0)'));
    });
});

describe("isReduceTransducer", () => {
    it("works", () => {
        assertThat(isReduceTransducer(reduce((a: number, b: number) => a + b, 0)), is(true));
        assertThat(isReduceTransducer(() => 'false'), is(false));
    });
});
