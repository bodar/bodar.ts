import {describe, test} from "bun:test";
import {parseScript, processJSX} from "../../src/javascript/script-parsing.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {findUnresolvedReferences} from "../../src/javascript/findUnresolvedReferences.ts";

describe("findUnresolvedReferences", () => {
    describe("basic variable declarations", () => {
        test("const declaration", () => assertThat(findUnresolvedReferences(parseScript('const x = 1; x;')), equals([])));
        test("let declaration", () => assertThat(findUnresolvedReferences(parseScript('let x = 1; x;')), equals([])));
        test("var declaration", () => assertThat(findUnresolvedReferences(parseScript('var x = 1; x;')), equals([])));
        test("multiple declarations", () => assertThat(findUnresolvedReferences(parseScript('const a = 1, b = 2; a + b;')), equals([])));
    });

    describe("unresolved references", () => {
        test("undeclared variable", () => assertThat(findUnresolvedReferences(parseScript('x;')), equals(['x'])));
        test("undeclared in expression", () => assertThat(findUnresolvedReferences(parseScript('const y = x + 1;')), equals(['x'])));
        test("multiple undeclared", () => assertThat(findUnresolvedReferences(parseScript('a + b;')), equals(['a', 'b'])));
        test("undeclared in template literal", () => assertThat(findUnresolvedReferences(parseScript('`${x}`')), equals(['x'])));
    });

    describe("destructuring patterns", () => {
        test("object destructuring", () => assertThat(findUnresolvedReferences(parseScript('const {a} = obj; a;')), equals(['obj'])));
        test("array destructuring", () => assertThat(findUnresolvedReferences(parseScript('const [a] = arr; a;')), equals(['arr'])));
        test("nested destructuring", () => assertThat(findUnresolvedReferences(parseScript('const {a: {b}} = obj; b;')), equals(['obj'])));
        test("renamed destructuring", () => assertThat(findUnresolvedReferences(parseScript('const {a: b} = obj; b;')), equals(['obj'])));
        test("rest element", () => assertThat(findUnresolvedReferences(parseScript('const [...rest] = arr; rest;')), equals(['arr'])));
        test("default in destructuring", () => assertThat(findUnresolvedReferences(parseScript('const {a = def} = obj; a;')), equals(['def', 'obj'])));
    });

    describe("function declarations", () => {
        test("function declaration", () => assertThat(findUnresolvedReferences(parseScript('function foo() {} foo();')), equals([])));
        test("function params", () => assertThat(findUnresolvedReferences(parseScript('function foo(a) { return a; }')), equals([])));
        test("function name in body", () => assertThat(findUnresolvedReferences(parseScript('function foo() { foo(); }')), equals([])));
        test("function expression", () => assertThat(findUnresolvedReferences(parseScript('const f = function(a) { return a; }')), equals([])));
        test("named function expression", () => assertThat(findUnresolvedReferences(parseScript('const f = function foo() { foo(); }')), equals([])));
    });

    describe("arrow functions", () => {
        test("arrow function params", () => assertThat(findUnresolvedReferences(parseScript('const f = (a) => a;')), equals([])));
        test("arrow function body ref", () => assertThat(findUnresolvedReferences(parseScript('const f = () => x;')), equals(['x'])));
        test("arrow destructured params", () => assertThat(findUnresolvedReferences(parseScript('const f = ({a}) => a;')), equals([])));
    });

    describe("imports", () => {
        test("default import", () => assertThat(findUnresolvedReferences(parseScript('import x from "mod"; x;')), equals([])));
        test("named import", () => assertThat(findUnresolvedReferences(parseScript('import {x} from "mod"; x;')), equals([])));
        test("renamed import", () => assertThat(findUnresolvedReferences(parseScript('import {x as y} from "mod"; y;')), equals([])));
        test("namespace import", () => assertThat(findUnresolvedReferences(parseScript('import * as m from "mod"; m;')), equals([])));
    });

    describe("block scope (let/const)", () => {
        test("let block scoped", () => assertThat(findUnresolvedReferences(parseScript('{ let x = 1; } x;')), equals(['x'])));
        test("const block scoped", () => assertThat(findUnresolvedReferences(parseScript('{ const x = 1; } x;')), equals(['x'])));
        test("for let scoped", () => assertThat(findUnresolvedReferences(parseScript('for (let i = 0; i < 1; i++) {} i;')), equals(['i'])));
        test("let visible in block", () => assertThat(findUnresolvedReferences(parseScript('{ let x = 1; x; }')), equals([])));
    });

    describe("function scope (var)", () => {
        test("var hoisted to function", () => assertThat(findUnresolvedReferences(parseScript('function f() { { var x = 1; } x; }')), equals([])));
        test("var not hoisted outside function", () => assertThat(findUnresolvedReferences(parseScript('function f() { var x = 1; } x;')), equals(['x'])));
    });

    describe("nested scopes", () => {
        test("inner sees outer", () => assertThat(findUnresolvedReferences(parseScript('const x = 1; function f() { return x; }')), equals([])));
        test("outer not sees inner", () => assertThat(findUnresolvedReferences(parseScript('function f() { const x = 1; } x;')), equals(['x'])));
        test("shadowing", () => assertThat(findUnresolvedReferences(parseScript('const x = 1; function f() { const x = 2; return x; }')), equals([])));
    });

    describe("default globals", () => {
        test("Array", () => assertThat(findUnresolvedReferences(parseScript('Array.from([])')), equals([])));
        test("console", () => assertThat(findUnresolvedReferences(parseScript('console.log(1)')), equals([])));
        test("document", () => assertThat(findUnresolvedReferences(parseScript('document.body')), equals([])));
        test("window", () => assertThat(findUnresolvedReferences(parseScript('window.location')), equals([])));
        test("undefined", () => assertThat(findUnresolvedReferences(parseScript('x === undefined')), equals(['x'])));
        test("Promise", () => assertThat(findUnresolvedReferences(parseScript('new Promise(() => {})')), equals([])));
    });

    describe("property access", () => {
        test("member expression", () => assertThat(findUnresolvedReferences(parseScript('obj.prop')), equals(['obj'])));
        test("computed member", () => assertThat(findUnresolvedReferences(parseScript('obj[key]')), equals(['obj', 'key'])));
        test("chained access", () => assertThat(findUnresolvedReferences(parseScript('a.b.c')), equals(['a'])));
        test("method call", () => assertThat(findUnresolvedReferences(parseScript('obj.method()')), equals(['obj'])));
    });

    describe("object literals", () => {
        test("object literal key", () => assertThat(findUnresolvedReferences(parseScript('const o = {key: val}')), equals(['val'])));
        test("shorthand property", () => assertThat(findUnresolvedReferences(parseScript('const o = {x}')), equals(['x'])));
        test("computed key", () => assertThat(findUnresolvedReferences(parseScript('const o = {[key]: val}')), equals(['key', 'val'])));
    });

    describe("class declarations", () => {
        test("class declaration", () => assertThat(findUnresolvedReferences(parseScript('class Foo {} new Foo()')), equals([])));
        test("class expression", () => assertThat(findUnresolvedReferences(parseScript('const C = class {}; new C()')), equals([])));
        test("class extends", () => assertThat(findUnresolvedReferences(parseScript('class Foo extends Bar {}')), equals(['Bar'])));
    });

    describe("catch clause", () => {
        test("catch parameter", () => assertThat(findUnresolvedReferences(parseScript('try {} catch (e) { e; }')), equals([])));
        test("catch destructured", () => assertThat(findUnresolvedReferences(parseScript('try {} catch ({message}) { message; }')), equals([])));
    });

    describe("for-in/for-of", () => {
        test("for-in variable", () => assertThat(findUnresolvedReferences(parseScript('for (const k in obj) { k; }')), equals(['obj'])));
        test("for-of variable", () => assertThat(findUnresolvedReferences(parseScript('for (const v of arr) { v; }')), equals(['arr'])));
    });

    describe("labels", () => {
        test("label", () => assertThat(findUnresolvedReferences(parseScript('label: while(true) { break label; }')), equals([])));
    });

    describe("de-duplication", () => {
        test("same unresolved twice", () => assertThat(findUnresolvedReferences(parseScript('x + x')), equals(['x'])));
        test("multiple different", () => assertThat(findUnresolvedReferences(parseScript('a + b + a')), equals(['a', 'b'])));
    });

    describe("correctly handles methods on unresolved references", () => {
        test("handles methods on references", () => assertThat(findUnresolvedReferences(parseScript('foo.bar()')), equals(['foo'])));
        test("handles methods on references", () => assertThat(findUnresolvedReferences(processJSX(parseScript('<span>Test</span>'))), equals(['jsx'])));
    });
});
