import {describe, it} from "bun:test";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {between} from "@bodar/totallylazy/predicates/BetweenPredicate.ts";

describe("BetweenPredicate", () => {
    const predicate = between(2, 4);

    it("can use built in comparators", () => {
        assertThat(predicate(1), is(false));
        assertThat(predicate(2), is(true));
        assertThat(predicate(3), is(true));
        assertThat(predicate(4), is(true));
        assertThat(predicate(5), is(false));
    });

    it("is inspectable", () => {
        assertThat(predicate.start, is(2));
        assertThat(predicate.end, is(4));
    });

    it("is self describing", () => {
        assertThat(predicate.toString(), is('between(2, 4)'));
    });
});
