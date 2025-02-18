import {describe, it} from "bun:test";
import {view} from "@bodar/totallylazy/parsers/View";
import {assertThat, assertTrue} from "@bodar/totallylazy/asserts/assertThat";
import {is} from "@bodar/totallylazy/predicates/IsPredicate";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate";
import {Json} from "@bodar/totallylazy/grammars/Json";
import {Failure} from "@bodar/totallylazy/parsers/Failure";

describe("Json", () => {
    it("can parse null", () => {
        assertThat(Json.null.parse(view('null')).value, is(null));
        assertTrue(Json.null.parse(view('failure')) instanceof Failure);
    });

    it("can parse boolean", () => {
        assertThat(Json.boolean.parse(view('true')).value, is(true));
        assertThat(Json.boolean.parse(view('false')).value, is(false));
        assertTrue(Json.boolean.parse(view('failure')) instanceof Failure);
    });

    it("can parse escaped character", () => {
        assertThat(Json.escaped.parse(view('\\"')).value, is('"'));
        assertThat(Json.escaped.parse(view('\\\\')).value, is('\\'));
        assertTrue(Json.escaped.parse(view('failure')) instanceof Failure);
    });

    it("can parse escaped unicode character", () => {
        assertThat(Json.escaped.parse(view('\\u03BB')).value, is(`λ`));
        assertThat(Json.escaped.parse(view('\\u5c71')).value, is('山'));
        assertThat(Json.escaped.parse(view('\\u7530')).value, is('田'));
        assertThat(Json.escaped.parse(view('\\u3000')).value, is('　'));
        assertThat(Json.escaped.parse(view('\\u7ae0')).value, is('章'));
        assertThat(Json.escaped.parse(view('\\u96c4')).value, is('雄'));
    });

    it("can parse string", () => {
        assertThat(Json.string.parse(view('""')).value, is(''));
        assertThat(Json.string.parse(view('"Word"')).value, is('Word'));
        assertThat(Json.string.parse(view('"This is some \\" random string"')).value, is('This is some " random string'));
        assertThat(Json.string.parse(view('"Text with unicode \u03BB after "')).value, is('Text with unicode λ after '));
        assertTrue(Json.string.parse(view('failure')) instanceof Failure);
    });

    it("string should not be greedy", () => {
        const result = Json.string.parse(view('"foo":"value"'));
        assertThat(result.value, is('foo'));
        assertThat(result.remainder.toSource(), is(':"value"'));
    });

    it("can parse number", () => {
        assertThat(Json.number.parse(view('12')).value, is(12));
        assertThat(Json.number.parse(view('12.1')).value, is(12.1));
        assertThat(Json.number.parse(view('-12')).value, is(-12));
    });

    it("can parse member", () => {
        assertThat(Json.member.parse(view('"foo":"value"')).value, equals(['foo', 'value']));
        assertThat(Json.member.parse(view('"foo":123')).value, equals(['foo', 123]));
    });

    it("can parse array", () => {
        assertThat(Json.array.parse(view('["foo"]')).value, equals(['foo']));
        assertThat(Json.array.parse(view('["foo",123]')).value, equals(['foo', 123]));
    });

    it("can parse object", () => {
        assertThat(Json.object.parse(view('{"foo":123}')).value, equals({foo: 123}));
        assertThat(Json.object.parse(view('{"foo":123,"bar":"baz"}')).value, equals({foo: 123, bar: 'baz'}));
    });

    it("handles whitespace", () => {
        assertThat(Json.value().parse(view(' [ [ "cats" , "dogs" ] , [ true , false ] , { "foo" : true , "bar" : false } ] ')).value,
            equals([["cats", "dogs"], [true, false], {"foo": true, "bar": false}]));
        assertThat(Json.value().parse(view(' null ')).value, is(null));
    });

    it("whitespace can contain a comment", () => {
        assertThat(Json.whitespace(Json.null).parse(view('// This is a single line comment\n null')).value,
            is(null));
        assertThat(Json.whitespace(Json.null).parse(view('/* This is a multi line comment */ null')).value,
            is(null));
    });

    it("ignores comments", () => {
        assertThat(Json.value().parse(view('// This is a single line comment\n "some string"')).value,
            is('some string'));
        assertThat(Json.value().parse(view('/* This is a multi line comment */ "some string"')).value,
            is('some string'));
    });

    it("can use a JSDOC comment to construct any custom Type that is in scope and takes a single Json value", () => {
        const map = Json.custom().parse(view('/** @type {Map} */ [["key", "value"]]')).value;
        assertTrue(map instanceof Map);
        assertThat(map.get('key'), is('value'));

        const set = Json.custom().parse(view('/** @type {Set} */ [1, 2]')).value;
        assertTrue(set instanceof Set);
        assertThat(set.has(1), is(true));
        assertThat(set.has(2), is(true));

        const date = Json.custom().parse(view('/** @type {Date} */ "2023-12-13T06:45:12.218Z"')).value;
        assertTrue(date instanceof Date);
        assertThat(date.toISOString(), is('2023-12-13T06:45:12.218Z'));
    });

    it("overrides value with the custom type", () => {
        const map = Json.value().parse(view('/** @type {Map} */ [["key", "value"]]')).value;
        assertTrue(map instanceof Map);
        assertThat((map as any).get('key'), is('value'));
    });
});
