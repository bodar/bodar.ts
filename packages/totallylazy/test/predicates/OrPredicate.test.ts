import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {or, isOrPredicate} from "@bodar/totallylazy/predicates/OrPredicate";
import {alwaysFalse} from "@bodar/totallylazy/functions/constant";
import {alwaysTrue} from "@bodar/totallylazy/functions/constant";
import {not} from "@bodar/totallylazy/predicates/NotPredicate";
import {and} from "@bodar/totallylazy/predicates/AndPredicate";

const even = (x: number) => x % 2 === 0;

describe("OrPredicate", () => {
    it("identity element is false", () => {
        assertThat(or(), equals(alwaysFalse));
    });

    it("when passed a single predicate just returns that", () => {
        const p = is(2);
        assertThat(or(p), equals(p));
    });

    it("returns true if any supplied predicates are true", () => {
        assertThat(or(even, is(2))(2), equals(true));
        assertThat(or(even, is(2))(3), equals(false));
    });

    it("removes redundant alwaysFalse", () => {
        assertThat(or(even, alwaysFalse), equals(even));
    });

    it("if alwaysTrue is present just return it instead", () => {
        assertThat(or(even, alwaysTrue), equals(alwaysTrue));
    });

    it("uses De Morgan's law to ensure 'not' is always on the outside", () => {
        assertThat(or(not(even), not(is(2))), equals(not(and(even, is(2)))));
    });

    it("collapses nested 'or' predicates", () => {
        assertThat(or(even, or(is(2), is(3))), equals(or(even, is(2), is(3))));
    });

    it("is inspectable", () => {
        assertThat(or(even, is(2)).predicates, equals([even, is(2)]));
    });

    it("is self describing", () => {
        assertThat(or(even, is(2)).toString(), equals('or((x) => x % 2 === 0, is(2))'));
    });
});

describe("isOrPredicate", () => {
    it("works", () => {
        assertThat(isOrPredicate(or(even, is(2))), equals(true));
        assertThat(isOrPredicate(() => false), equals(false));
    });
});