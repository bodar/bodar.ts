// Never hand DOM nodes to expect(): a failing toBe/toEqual pretty-prints the whole (cyclic) linkedom DOM.
import {describe, expect, test} from "bun:test";
import {parseHTML} from "linkedom";
import {PositionalJSX} from "@bodar/jsx2dom/PositionalJSX.ts";
import {transformModuleJSX} from "../../src/jsx-transform/module.ts";

/** Evaluates a module that is one arrow function expression */
const helper = (javascript: string, id: string) => new Function(`return ${transformModuleJSX(javascript, id)}`)();

describe("transformModuleJSX", () => {
    test("compiles a module's JSX to positional elements whose sites are unique to the module", () => {
        expect(transformModuleJSX('export const chip = (jsx, x) => <b>{x}</b>;', 'ui/chip.tsx'))
            .toBe('export const chip = (jsx, x) => jsx.element("ui/chip.tsx@32", "b", null, () => x);');
    });

    test("a module helper called from a run hands back last run's element", () => {
        const chip = helper('(jsx, x) => <p><b>{x}</b></p>;', 'chip.tsx');
        const render = new PositionalJSX(parseHTML('')).wrap((jsx, x: string) => chip(jsx, x) as Element);
        const p = render('a');
        expect(render('b') === p).toBe(true);
        expect(p.outerHTML).toBe('<p><b>b</b></p>');
    });

    test("two modules with JSX at the same offset don't share elements", () => {
        const a = helper('(jsx) => <i/>;', 'a.tsx');
        const b = helper('(jsx) => <i/>;', 'b.tsx');
        const render = new PositionalJSX(parseHTML('')).wrap((jsx, which: string) => (which === 'a' ? a : b)(jsx) as Node);
        const first = render('a');
        expect(render('b') !== first).toBe(true);
    });
});
