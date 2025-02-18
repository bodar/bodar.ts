import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {segment, toString} from "@bodar/totallylazy/collections/Segment";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";

describe("Segment", () => {
    it("can create from parts", () => {
        assertThat(segment().toArray(), equals([]));
        assertThat(segment(1).toArray(), equals([1]));
        assertThat(segment(1, segment(2)).toArray(), equals([1, 2]));
        assertThat(segment(1, segment(2, segment(3))).toArray(), equals([1, 2, 3]));
    });

    it("supports toString", () => {
        assertThat(toString(segment()), is('segment()'));
        assertThat(toString(segment(1)), is('segment(1)'));
        assertThat(toString(segment(1, segment(2))), is('segment(1, segment(2))'));
        assertThat(toString(segment(1, segment(2, segment(3)))), is('segment(1, segment(2, segment(3)))'));
    });
});