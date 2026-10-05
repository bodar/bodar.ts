import {describe, test, expect} from "bun:test";
import {parseScript, toScript} from "../../src/javascript/script-parsing.ts";
import {transformJSX} from "../../src/jsx-transform/transformer.ts";

const transform = (jsx: string) => toScript(transformJSX(parseScript(jsx)));

describe("transformJSX", () => {
    describe("elements", () => {
        test("lowercase becomes string literal", () => expect(transform("<div />")).toBe('jsx.element(0, "div", null);'));
        test("uppercase becomes identifier", () => expect(transform("<Foo />")).toBe('jsx.element(0, Foo, null);'));
        test("member expression", () => expect(transform("<Foo.Bar />")).toBe('jsx.element(0, Foo.Bar, null);'));
        test("nested member expression", () => expect(transform("<A.B.C />")).toBe('jsx.element(0, A.B.C, null);'));
    });

    describe("attributes", () => {
        test("string attribute", () => expect(transform('<div id="x" />')).toBe('jsx.element(0, "div", {"id": "x"});'));
        test("expression attribute", () => expect(transform('<div id={x} />')).toBe('jsx.element(0, "div", {"id": x});'));
        test("boolean attribute", () => expect(transform('<input disabled />')).toBe('jsx.element(0, "input", {"disabled": true});'));
        test("spread attribute", () => expect(transform('<div {...props} />')).toBe('jsx.element(0, "div", {...props});'));
        test("mixed attributes", () => expect(transform('<div a="1" {...p} b={2} />')).toBe('jsx.element(0, "div", {"a": "1",...p,"b": 2});'));
    });

    describe("children", () => {
        test("text child", () => expect(transform('<div>hello</div>')).toBe('jsx.element(0, "div", null, "hello");'));
        test("expression child", () => expect(transform('<div>{x}</div>')).toBe('jsx.element(0, "div", null, () => x);'));
        test("element child", () => expect(transform('<div><span /></div>')).toBe('jsx.element(0, "div", null, () => jsx.element(5, "span", null));'));
        test("mixed children", () => expect(transform('<div>a{b}c</div>')).toBe('jsx.element(0, "div", null, "a", () => b, "c");'));
    });

    describe("fragments", () => {
        test("empty fragment", () => expect(transform('<></>')).toBe('jsx.element(0, null, null);'));
        test("fragment with children", () => expect(transform('<><a /><b /></>')).toBe('jsx.element(0, null, null, () => jsx.element(2, "a", null), () => jsx.element(7, "b", null));'));
    });

    describe("expressions", () => {
        test("template literal", () => expect(transform('<div>{`hello ${x}`}</div>')).toBe('jsx.element(0, "div", null, () => `hello ${x}`);'));
        test("binary expression", () => expect(transform('<div>{a + b}</div>')).toBe('jsx.element(0, "div", null, () => a + b);'));
        test("call expression", () => expect(transform('<div>{foo()}</div>')).toBe('jsx.element(0, "div", null, () => foo());'));
        test("member expression", () => expect(transform('<div>{a.b}</div>')).toBe('jsx.element(0, "div", null, () => a.b);'));
        test("arrow function", () => expect(transform('<div>{() => x}</div>')).toBe('jsx.element(0, "div", null, () => () => x);'));
        test("conditional", () => expect(transform('<div>{a ? b : c}</div>')).toBe('jsx.element(0, "div", null, () => a ? b : c);'));
        test("await stays eager, in an array", () => expect(transform('async () => <div>{await x}</div>')).toBe('(async () => jsx.element(12, "div", null, [await x]));'));
        test("an await in a grandchild's attribute makes that child eager", () => expect(transform('async () => <div><p title={await t}/></div>')).toBe('(async () => jsx.element(12, "div", null, [jsx.element(17, "p", {"title": await t})]));'));
        test("an await inside a nested function is still a thunk", () => expect(transform('<div>{xs.map(async x => await x)}</div>')).toBe('jsx.element(0, "div", null, () => xs.map(async x => await x));'));
        test("empty expression is dropped", () => expect(transform('<div>{/* note */}</div>')).toBe('jsx.element(0, "div", null);'));
    });

    describe("custom factory", () => {
        test("single identifier", () => expect(toScript(transformJSX(parseScript('<div />'), {factory: "h"}))).toBe('h(0, "div", null);'));
        test("member expression factory", () => expect(toScript(transformJSX(parseScript('<div />'), {factory: "React.createElement"}))).toBe('React.createElement(0, "div", null);'));
    });
});

describe("whitespace handling - no processing, let HTML collapse naturally", () => {
    describe("preserves all whitespace", () => {
        test("space between text and expression", () => expect(transform('<i>Hello {name}!</i>')).toBe('jsx.element(0, "i", null, "Hello ", () => name, "!");'));
        test("space before expression", () => expect(transform('<i> {x}</i>')).toBe('jsx.element(0, "i", null, " ", () => x);'));
        test("space after expression", () => expect(transform('<i>{x} </i>')).toBe('jsx.element(0, "i", null, () => x, " ");'));
        test("multiple spaces", () => expect(transform('<i>a  b</i>')).toBe('jsx.element(0, "i", null, "a  b");'));
        test("leading space", () => expect(transform('<i> hello</i>')).toBe('jsx.element(0, "i", null, " hello");'));
        test("trailing space", () => expect(transform('<i>hello </i>')).toBe('jsx.element(0, "i", null, "hello ");'));
        test("only spaces", () => expect(transform('<i>   </i>')).toBe('jsx.element(0, "i", null, "   ");'));
    });

    describe("preserves newlines (HTML collapses them, pre preserves them)", () => {
        test("newline between elements", () => expect(transform('<div>\n<span />\n</div>')).toBe('jsx.element(0, "div", null, "\\n", () => jsx.element(6, "span", null), "\\n");'));
        test("newline in text", () => expect(transform('<i>hello\nworld</i>')).toBe('jsx.element(0, "i", null, "hello\\nworld");'));
        test("newline with indent", () => expect(transform('<i>hello\n  world</i>')).toBe('jsx.element(0, "i", null, "hello\\n  world");'));
    });
});
