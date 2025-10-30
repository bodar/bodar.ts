import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {filter} from "@bodar/totallylazy/transducers/FilterTransducer.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {compose, decompose} from "@bodar/totallylazy/transducers/CompositeTransducer.ts";
import {map} from "@bodar/totallylazy/transducers/MapTransducer.ts";

describe("CompositeTransducer", () => {
    const even = (x: number) => x % 2 === 0;
    const f = filter(even);
    const m = map(String);
    const t = compose(f, m);

    it("can compose together multiple Transducers", () => {
        assertThat(Array.from(t([1, 2, 3, 4, 5])), equals(['2', '4']));
    });

    it("is inspectable", () => {
        assertThat(t.transducers, equals([f, m]));
    });

    it("is self describing", () => {
        assertThat(t.toString(), is(`compose(${f},${m})`));
    });

    it("overload works with more than 2 arguments", () => {
        const r = compose(filter(even), map(String), filter(v => v.length > 1), map(Number));
        assertThat(Array.from(r([1, 2, 5, 10])), equals([10]));
    });

    it("always flattens nested transducers", () => {
        const r = compose(filter(even), map(String), compose(filter(v => v.length > 1), map(Number)));
        assertThat(r.transducers.length, is(4));
    });

});

describe("decompose", () => {
    const even = (x: number) => x % 2 === 0;
    const f = filter(even);
    const m = map(String);

    it("yields single transducer for non-composite", () => {
        assertThat(Array.from(decompose(f)), equals([f]));
    });

    it("yields all transducers from composite", () => {
        const t = compose(f, m);
        assertThat(Array.from(decompose(t)), equals([f, m]));
    });

    it("recursively decomposes nested composites", () => {
        const inner = compose(f, m);
        const outer = compose(inner, map(Number));
        const result = Array.from(decompose(outer));
        assertThat(result.length, is(3));
        assertThat(result[0], is(f));
        assertThat(result[1], is(m));
    });
});
