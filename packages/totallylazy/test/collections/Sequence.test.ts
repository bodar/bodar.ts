import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";
import {sequence} from "@bodar/totallylazy/collections/Sequence.ts";

describe("Sequence", () => {
    const even = (x: number) => x % 2 === 0;
    const f = filter(even);
    const m = map(String);
    const original = [1, 2, 3, 4, 5];
    const t = sequence(original, f, m);

    it("can compose together multiple Transducers", () => {
        assertThat(Array.from(t), equals(['2', '4']));
    });

    it("is inspectable", () => {
        assertThat(t.source, is(original));
        assertThat(t.transducers, equals([f, m]));
    });

    it("is self describing", () => {
        assertThat(t.toString(), is(`sequence(${original}, ${f},${m})`));
    });

    it("collapse nested sequences", () => {
        const r = sequence(t, filter(v => v.length > 1), map(Number));
        assertThat(r.source, is(original));
        assertThat(r.transducers.length, is(4));
    });
});
