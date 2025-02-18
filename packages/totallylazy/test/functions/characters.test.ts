import {describe, it} from "bun:test";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {characters} from "@bodar/totallylazy/functions/characters";

describe("characters", () => {
    it("supports unicode", () => {
        // https://mathiasbynens.be/notes/javascript-unicode
        assertThat(characters('Iñtërnâtiônàlizætiøn☃💩').length, is(22));
    });
});