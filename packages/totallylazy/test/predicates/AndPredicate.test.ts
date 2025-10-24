import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {alwaysTrue, alwaysFalse} from "@bodar/totallylazy/functions/constant.ts"
import {not} from "@bodar/totallylazy/predicates/NotPredicate.ts";
import {or} from "@bodar/totallylazy/predicates/OrPredicate.ts";
import {and, isAndPredicate} from "@bodar/totallylazy/predicates/AndPredicate.ts";

const even = (x: number) => x % 2 === 0;

describe("AndPredicate", () => {
    it("identity element is true", () => {
        assertThat(and(), equals(alwaysTrue));
    });

    it("when passed a single predicate just returns that", () => {
        const p = is(2);
        assertThat(and(p), equals(p));
    });

    it("returns true only if all supplied predicates are true", () => {
        assertThat(and(even, is(2))(2), equals(true));
        assertThat(and(even, is(2))(4), equals(false));
    });

    it("removes redundant alwaysTrue", () => {
        assertThat(and(even, alwaysTrue), equals(even));
    });

    it("if alwaysFalse is present just return it instead", () => {
        assertThat(and(even, alwaysFalse), equals(alwaysFalse));
    });

    it("uses De Morgan's law to ensure 'not' is always on the outside", () => {
        assertThat(and(not(even), not(is(2))), equals(not(or(even, is(2)))));
    });

    it("collapses nested 'and' predicates", () => {
        assertThat(and(even, and(is(2))), equals(and(even, is(2))));
    });

    it("is inspectable", () => {
        assertThat(and(even, is(2)).toString(), is('and((x) => x % 2 === 0, is(2))'));
    });

    it("is self describing", () => {
        assertThat(and(even, is(2)).toString(), is('and((x) => x % 2 === 0, is(2))'));
    });

    it("works", () => {
        assertThat(isAndPredicate(and(even, is(2))), is(true));
        assertThat(isAndPredicate(even), is(false));
    });
});

describe("isAndPredicate", () => {
    it("works", () => {
        assertThat(isAndPredicate(and(even, is(2))), is(true));
        assertThat(isAndPredicate(even), is(false));
    });
});