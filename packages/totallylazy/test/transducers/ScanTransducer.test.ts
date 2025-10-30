import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {scan, isScanTransducer} from "@bodar/totallylazy/transducers/ScanTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("ScanTransducer", () => {
    const add = (acc: number, val: number) => acc + val;
    const transducer = scan(add, 0);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3])), equals([0, 1, 3, 6]));
    });

    it("yields seed first", () => {
        assertThat(Array.from(scan(add, 10)([1, 2, 3])), equals([10, 11, 13, 16]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([0]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer([5])), equals([0, 5]));
    });

    it("works with different types", () => {
        const concat = (acc: string, val: number) => acc + val;
        const stringTransducer = scan(concat, "");
        assertThat(Array.from(stringTransducer([1, 2, 3])), equals(["", "1", "12", "123"]));
    });

    it("is inspectable", () => {
        assertThat(transducer.reducer, is(add));
        assertThat(transducer.seed, is(0));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('scan((acc, val) => acc + val, 0)'));
    });
});

describe("isScanTransducer", () => {
    it("works", () => {
        assertThat(isScanTransducer(scan((a: number, b: number) => a + b, 0)), is(true));
        assertThat(isScanTransducer(() => 'false'), is(false));
    });
});
