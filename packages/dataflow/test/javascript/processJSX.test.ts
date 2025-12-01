import {describe, test} from "bun:test";
import {parseScript, processJSX, toScript} from "../../src/javascript/script-parsing.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";
import {findUnresolvedReferences} from "../../src/javascript/findUnresolvedReferences.ts";

describe("findUnresolvedReferences", () => {
    test("can detected undeclared variables", () => {
        const program = parseScript('const x = 1 + a;');
        const refs = findUnresolvedReferences(program);
        assertThat(refs, equals(['a']));
    });

    test("can detected undeclared variables even when inside a string literal", () => {
        const program = parseScript("const x = `Hello ${a}!`;");
        const refs = findUnresolvedReferences(program);
        assertThat(refs, equals(['a']));
    });

    test("can detected undeclared variables even when inside a string literal and part of an expression", () => {
        const program = parseScript(`    const rainbow = document.createElement('div');
    rainbow.style.color = \`hsl(\${((now / 10) % 360)} 100% 50%)\`;
    rainbow.innerText = 'Rainbow text!';`);
        const refs = findUnresolvedReferences(program);
        assertThat(refs, equals(['document', 'now']));
    });


});

describe("processJSX", () => {
    test('supports JSX code', () => {
        const program = parseScript("<span style={`color: hsl(${(now / 10) % 360} 100% 50%)`}>Rainbow text!</span>");
        const result = toScript(processJSX(program));
        assertThat(result, equals('jsx.createElement("span", {"style": `color: hsl(${now / 10 % 360} 100% 50%)`}, ["Rainbow text!"]);'));
    });

    test('preserves whitespace between text and expressions', () => {
        const program = parseScript("<i>Hello {name}!</i>");
        const result = toScript(processJSX(program));
        assertThat(result, equals('jsx.createElement("i", null, ["Hello ", name, "!"]);'));
    });
});

