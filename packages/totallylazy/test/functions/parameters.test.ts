import {describe, it} from "bun:test";
import {assertThat} from "../../src/asserts/assertThat.ts";
import {parameter, parametersOf} from "../../src/functions/parameters.ts";
import {equals} from "../../src/predicates/EqualsPredicate.ts";

describe("parametersOf", () => {
    it("can extract the parameters of a named function", () => {
        assertThat(parametersOf(function add(a: any, b: any) {
            return a + b;
        }), equals([parameter('a'), parameter('b')]));
    });

    it("can extract the parameters of an anonymous function", () => {
        assertThat(parametersOf(function (a: any, b: any) {
            return a + b;
        }), equals([parameter('a'), parameter('b')]));
    });

    it("can extract the parameters of an arrow function", () => {
        assertThat(parametersOf((a: any, b: any) => a + b), equals([parameter('a'), parameter('b')]));
    });

    it("can extract the parameters of a function with defaults", () => {
        assertThat(parametersOf(function multiply(a: number, b = 1) {
            return a * b;
        }), equals([parameter('a'), parameter('b', '1')]));
    });
});