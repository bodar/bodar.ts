import {describe, it} from "bun:test";
import {Jsdoc, JsdocComment} from "@bodar/totallylazy/grammars/Jsdoc";
import {view} from "@bodar/totallylazy/parsers/View";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";

describe("JsdocGrammar", () => {
    it("can parse a JSDOC comment", () => {
        const map = Jsdoc.jsdoc.parse(view('/** @type {Map} */')).value;
        assertThat(map, equals(new JsdocComment({type: 'Map'})));
    });
});