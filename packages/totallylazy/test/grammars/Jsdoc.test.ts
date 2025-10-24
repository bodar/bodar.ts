import {describe, it} from "bun:test";
import {Jsdoc, JsdocComment} from "@bodar/totallylazy/grammars/Jsdoc.ts";
import {view} from "@bodar/totallylazy/parsers/View.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("JsdocGrammar", () => {
    it("can parse a JSDOC comment", () => {
        const map = Jsdoc.jsdoc.parse(view('/** @type {Map} */')).value;
        assertThat(map, equals(new JsdocComment({type: 'Map'})));
    });
});