import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is, isIsPredicate} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("IsPredicate", () => {
    it("uses Object.is for equality", () => {
        assertThat(is(2)(2), equals(true));
        assertThat(is(2)(3), equals(false));
        assertThat(is(NaN)(NaN), equals(true));
    });

    it("is inspectable", () => {
        assertThat(is(2).value, equals(2));
    });

    it("has function name", () => {
        assertThat(is(2).name, equals('is'));
    });

    it("is self describing", () => {
        assertThat(is(2).toString(), equals('is(2)'));
    });
});

describe("isIsPredicate", () => {
    it("works", () => {
        assertThat(isIsPredicate(is(2)), equals(true));
        assertThat(isIsPredicate(is(undefined)), equals(true));
        assertThat(isIsPredicate(() => 'false'), equals(false));
    });
});