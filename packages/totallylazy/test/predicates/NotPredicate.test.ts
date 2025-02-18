import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {not} from "@bodar/totallylazy/predicates/NotPredicate";

describe("NotPredicate", () => {
    it("negates the original predicate", () => {
        assertThat(not(is(2))(3), is(true));
        assertThat(not(is(2))(2), is(false));
    });

    it("is inspectable", () => {
        const p = is(2);
        assertThat(not(p).predicate, is(p));
    });

    it("is self describing", () => {
        assertThat(not(is(2)).toString(), is('not(is(2))'));
    });
});