import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {zipWithIndex, isZipWithIndexTransducer} from "@bodar/totallylazy/transducers/ZipWithIndexTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("ZipWithIndexTransducer", () => {
    const transducer = zipWithIndex<string>();

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer(["a", "b", "c"])), equals([["a", 0], ["b", 1], ["c", 2]]));
    });

    it("starts index at 0", () => {
        assertThat(Array.from(zipWithIndex()([10, 20, 30])), equals([[10, 0], [20, 1], [30, 2]]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles single element", () => {
        assertThat(Array.from(transducer(["x"])), equals([["x", 0]]));
    });

    it("works with numbers", () => {
        assertThat(Array.from(zipWithIndex<number>()([5, 10, 15])), equals([[5, 0], [10, 1], [15, 2]]));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('zipWithIndex()'));
    });
});

describe("isZipWithIndexTransducer", () => {
    it("works", () => {
        assertThat(isZipWithIndexTransducer(zipWithIndex()), is(true));
        assertThat(isZipWithIndexTransducer(() => 'false'), is(false));
    });
});
