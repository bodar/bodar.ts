import {describe, expect, test} from "bun:test";
import {parseScript} from "../src/javascript/script-parsing.ts";
import {Imports, removeImports} from "../src/javascript/Imports.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("Imports", () => {
    test('can find imports', () => {
        const program = parseScript('import {JSX2DOM, another} from "@bodar/jsx2dom/JSX2DOM.ts";');
        const result = Imports.from(program);
        assertThat(result.get('@bodar/jsx2dom/JSX2DOM.ts'), equals('{JSX2DOM,another}'));
    });

    test('supports namespace imports', () => {
        const program = parseScript('import * as Inputs from "https://cdn.jsdelivr.net/npm/@observablehq/inputs@0.12/+esm";');
        const result = Imports.from(program);
        assertThat(result.get('https://cdn.jsdelivr.net/npm/@observablehq/inputs@0.12/+esm'), equals('Inputs'));
    });

    test('supports default imports', () => {
        const program = parseScript('import foo from "module";');
        const result = Imports.from(program);
        assertThat(result.get('module'), equals('{default:foo}'));
    });

    test('can remove imports', () => {
        const program = parseScript('import {JSX2DOM, another} from "@bodar/jsx2dom/JSX2DOM.ts";');
        removeImports(program);
        assertThat(program.body.some(v => v.type === 'ImportDeclaration'), equals(false));
    });

    test('can convert imports to JS', () => {
        const program = parseScript('import {Renderer} from "@bodar/dataflow/Renderer.ts";\nimport {JSX2DOM, another} from "@bodar/jsx2dom/JSX2DOM.ts";');
        const result = Imports.from(program).toString();
        expect(result).toBe("const [{Renderer}, {JSX2DOM,another}] = await Promise.all([import('@bodar/dataflow/Renderer.ts'), import('@bodar/jsx2dom/JSX2DOM.ts')]);\n");
    });
});