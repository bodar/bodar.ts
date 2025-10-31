import {curry, parameter, parametersOf} from "../../src/functions/curry.ts";
import {describe, it} from "bun:test";
import {assertThat} from "../../src/asserts/assertThat.ts";
import {is} from "../../src/predicates/IsPredicate.ts";
import {equals} from "../../src/predicates/EqualsPredicate.ts";

function add(a: number, b: number) {
    return a + b;
}

describe("curry", () => {
    it("a curried function is still a function", () => {
        assertThat(typeof curry(add), is('function'));
    });

    it("a curried function still has the correct name", () => {
        assertThat(curry(add).name, is('add'));
    });

    it("once curried if all arguments are applied, just call the function", () => {
        assertThat(curry(add)(1, 2), is(3));
    });

    it("once curried can apply an argument", () => {
        const partial = curry(add)(1);
        assertThat(partial(2), is(3));
    });

    it("once applied previous arguments are captured", () => {
        assertThat(curry(add)(1).a, is(1));
    });

    it("once applied it's still a named function", () => {
        const applied = curry(add)(1);
        assertThat(typeof applied, is('function'));
        assertThat(applied.name, is('add'));
    });

    it("can keep applying more and more arguments", () => {
        const applied = curry((a: number, b: number, c: number, d: number) => a + b + c + d)(1)(2)(3);
        assertThat(typeof applied, is('function'));
        assertThat(applied(4), is(10));
        assertThat(applied.a, is(1));
        assertThat(applied.b, is(2));
        assertThat(applied.c, is(3));
    });

    it("if function has default parameter then it can be called with or with that parameter", () => {
        const curried = curry(function multiply(a: number, b = 2) {
            return a * b;
        });
        assertThat(curried(3), is(6));
        assertThat(curried(3, 3), is(9));
    });

    it("if functions arguments conflict with standard function properties it will not override them", () => {
        const applied = curry(function weird(name: string, toString: Function) { return name + toString(); })('Dan');
        assertThat(applied.name, is('weird'));
        assertThat(applied.toString(), is('function weird(name, toString) { return name + toString(); }'));
    });

    it("if functions arguments conflict with standard function properties it will not override them", () => {
        const s = (function weird(name: string, toString: Function) { return name + toString(); }).toString().replaceAll(/\s+/g, ' ');
        assertThat(s, is('function weird(name, toString) { return name + toString(); }'));
    });

});

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