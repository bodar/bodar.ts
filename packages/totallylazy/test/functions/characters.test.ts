import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {characters} from "@bodar/totallylazy/functions/characters.ts";

describe("characters", () => {
    it("supports unicode", () => {
        // https://mathiasbynens.be/notes/javascript-unicode
        assertThat(characters('Iñtërnâtiônàlizætiøn☃💩').length, is(22));
    });
});