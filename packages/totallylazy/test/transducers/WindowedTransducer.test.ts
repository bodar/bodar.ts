import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {windowed, isWindowedTransducer} from "@bodar/totallylazy/transducers/WindowedTransducer.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";

describe("WindowedTransducer", () => {
    it("can be created first then applied to an iterable", () => {
        const transducer = windowed<number>(3);
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals([[1, 2, 3], [2, 3, 4], [3, 4, 5]]));
    });

    it("handles step parameter", () => {
        assertThat(Array.from(windowed<number>(2, 2)([1, 2, 3, 4, 5])), equals([[1, 2], [3, 4]]));
    });

    it("handles step larger than size", () => {
        assertThat(Array.from(windowed<number>(2, 3)([1, 2, 3, 4, 5, 6])), equals([[1, 2], [4, 5]]));
    });

    it("handles remainder true", () => {
        assertThat(Array.from(windowed<number>(3, 1, true)([1, 2, 3, 4])), equals([[1, 2, 3], [2, 3, 4], [3, 4]]));
    });

    it("handles remainder false (default)", () => {
        assertThat(Array.from(windowed<number>(3)([1, 2, 3, 4, 5])), equals([[1, 2, 3], [2, 3, 4], [3, 4, 5]]));
    });

    it("handles empty iterables", () => {
        assertThat(Array.from(windowed<number>(3)([])), equals([]));
    });

    it("handles iterable smaller than window", () => {
        assertThat(Array.from(windowed<number>(5)([1, 2, 3])), equals([]));
    });

    it("handles iterable smaller than window with remainder", () => {
        assertThat(Array.from(windowed<number>(5, 1, true)([1, 2, 3])), equals([[1, 2, 3]]));
    });

    it("works with strings", () => {
        assertThat(Array.from(windowed<string>(2)(["a", "b", "c", "d"])), equals([["a", "b"], ["b", "c"], ["c", "d"]]));
    });

    it("is inspectable", () => {
        const transducer = windowed<number>(3, 2, true);
        assertThat(transducer.size, is(3));
        assertThat(transducer.step, is(2));
        assertThat(transducer.remainder, is(true));
    });

    it("is self describing", () => {
        assertThat(windowed(3, 2, true).toString(), is('windowed(3, 2, true)'));
    });
});

describe("isWindowedTransducer", () => {
    it("works", () => {
        assertThat(isWindowedTransducer(windowed(3)), is(true));
        assertThat(isWindowedTransducer(() => 'false'), is(false));
    });
});
