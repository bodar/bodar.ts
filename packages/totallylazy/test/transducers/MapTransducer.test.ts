import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {map, isMapTransducer} from "@bodar/totallylazy/transducers/MapTransducer";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";

describe("MapTransducer", () => {
    const transducer = map(String);

    it("can be created first then applied to an iterable", () => {
        assertThat(Array.from(transducer([1, 2, 3, 4, 5])), equals(['1', '2', '3', '4', '5']));
    });

    it("is inspectable",  () => {
        assertThat(transducer.mapper, is(String));
    });

    it("is self describing",  () => {
        assertThat(transducer.toString(), is(`map(${String})`));
    });
});

describe("isMapTransducer", () => {
    it("works",  () => {
        assertThat(isMapTransducer(map(String)), is(true));
        assertThat(isMapTransducer(() => 'false'), is(false));
    });
});