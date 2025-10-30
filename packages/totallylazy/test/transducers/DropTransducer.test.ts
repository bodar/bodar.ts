import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {drop, isDropTransducer} from "@bodar/totallylazy/transducers/DropTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("DropTransducer", () => {
    const transducer = drop<number>(2);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([3, 4, 5]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(transducer([])), equals([]));
    });

    it("handles iterables shorter than count", () => {
        assertThat(Array.from(drop<number>(5)([1, 2])), equals([]));
    });

    it("handles zero count", () => {
        assertThat(Array.from(drop<number>(0)([1, 2, 3])), equals([1, 2, 3]));
    });

    it("handles negative count", () => {
        assertThat(Array.from(drop<number>(-1)([1, 2, 3])), equals([1, 2, 3]));
    });

    it("is inspectable", () => {
        assertThat(transducer.count, is(2));
    });

    it("is self describing", () => {
        assertThat(transducer.toString(), is('drop(2)'));
    });
});

describe("isDropTransducer", () => {
    it("works", () => {
        assertThat(isDropTransducer(drop(2)), is(true));
        assertThat(isDropTransducer(() => 'false'), is(false));
    });
});
