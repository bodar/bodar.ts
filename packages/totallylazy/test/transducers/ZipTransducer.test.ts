import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {zip, isZipTransducer} from "@bodar/totallylazy/transducers/ZipTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("ZipTransducer", () => {
    const transducer = zip([10, 20, 30]);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3])), equals([[1, 10], [2, 20], [3, 30]]));
    });

    it("stops when first iterable ends", () => {
        assertThat(Array.from(zip([10, 20, 30, 40])([1, 2])), equals([[1, 10], [2, 20]]));
    });

    it("stops when second iterable ends", () => {
        assertThat(Array.from(zip([10, 20])([1, 2, 3, 4])), equals([[1, 10], [2, 20]]));
    });

    it("handles empty first iterable", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles empty second iterable", () => {
        assertThat(Array.from(zip([])([1, 2, 3])), equals([]));
    });

    it("works with different types", () => {
        assertThat(Array.from(zip(["a", "b", "c"])([1, 2, 3])), equals([[1, "a"], [2, "b"], [3, "c"]]));
    });

    it("is inspectable", () => {
        assertThat(transducer.other, equals([10, 20, 30]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('zip(10,20,30)'));
    });
});

describe("isZipTransducer", () => {
    it("works", () => {
        assertThat(isZipTransducer(zip([1, 2, 3])), is(true));
        assertThat(isZipTransducer(() => 'false'), is(false));
    });
});
