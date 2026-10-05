import {describe, expect, test} from "bun:test";
import {parseScript} from "../../src/javascript/script-parsing.ts";
import {Imports, removeImports} from "../../src/javascript/Imports.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {equals} from "@bodar/totallylazy/predicates/EqualsPredicate.ts";

describe("Imports", () => {
    test('can find imports', () => {
        const program = parseScript('import {JSX2DOM, another} from "@bodar/jsx2dom/JSX2DOM.ts";');
        const result = Imports.from(program);
        assertThat(result.get('@bodar/jsx2dom/JSX2DOM.ts')?.specifier, equals('{JSX2DOM,another}'));
    });

    test('supports namespace imports', () => {
        const program = parseScript('import * as Inputs from "https://cdn.jsdelivr.net/npm/@observablehq/inputs@0.12/+esm";');
        const result = Imports.from(program);
        assertThat(result.get('https://cdn.jsdelivr.net/npm/@observablehq/inputs@0.12/+esm')?.specifier, equals('Inputs'));
    });

    test('supports default imports', () => {
        const program = parseScript('import foo from "module";');
        const result = Imports.from(program);
        assertThat(result.get('module')?.specifier, equals('{default:foo}'));
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

    test('keeps a renamed import', () => {
        expect(Imports.from(parseScript("import {a as b, c} from \"m\";")).toString()).toBe("const [{a:b,c}] = await Promise.all([import('m')]);\n");
    });

    test('keeps the named imports next to a default import', () => {
        expect(Imports.from(parseScript("import d, {x as y} from \"m\";")).toString()).toBe("const [{default:d,x:y}] = await Promise.all([import('m')]);\n");
    });

    test('supports a default import next to a namespace import', () => {
        expect(Imports.from(parseScript("import d, * as ns from \"m\";")).toString()).toBe("const [ns, {default:d}] = await Promise.all([import('m'), import('m')]);\n");
    });

    test('supports side effect only imports', () => {
        expect(Imports.from(parseScript("import \"polyfill.js\";")).toString()).toBe("const [{}] = await Promise.all([import('polyfill.js')]);\n");
    });

    test('keeps every import from the same source', () => {
        expect(Imports.from(parseScript("import {a} from \"m\";\nimport * as M from \"m\";")).toString()).toBe("const [{a}, M] = await Promise.all([import('m'), import('m')]);\n");
    });

    test('the locals are the names the block binds', () => {
        expect(Imports.from(parseScript('import d, {x as y} from "m"; import * as ns from "n"; import "p";')).locals()).toEqual(['d', 'y', 'ns']);
    });
});
