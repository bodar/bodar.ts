import {describe, it} from "bun:test";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {among} from "@bodar/totallylazy/predicates/AmongPredicate.ts";

describe("AmongPredicate", () => {
    const vowels = among('aeiou');

    it("returns true for characters in the set", () => {
        assertThat(vowels('a'), is(true));
        assertThat(vowels('e'), is(true));
        assertThat(vowels('i'), is(true));
        assertThat(vowels('o'), is(true));
        assertThat(vowels('u'), is(true));
    });

    it("returns false for characters not in the set", () => {
        assertThat(vowels('b'), is(false));
        assertThat(vowels('z'), is(false));
        assertThat(vowels('A'), is(false));
    });

    it("is inspectable", () => {
        assertThat(vowels.characters, is('aeiou'));
    });

    it("is self describing", () => {
        assertThat(vowels.toString(), is("among('aeiou')"));
    });
});