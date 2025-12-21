import {describe, expect, test} from "bun:test";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";

describe("NodeDefinition", () => {
    test("detects explicit display function from runtime import", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {display} from "@bodar/dataflow/runtime.ts";
            const input = display(<input name="name" type="text" value="Dan"/>);
        `, '1234');

        expect(definition.hasExplicitDisplay()).toBe(true);

        // Without strip options, display remains in inputs/outputs/imports
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],["input","display"],async(jsx) => {
const [{display}] = await Promise.all([import('@bodar/dataflow/runtime.ts')]);
const display = Display.for("1234", _runtime_);
const input = display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,display};
}`)

        // With strip options (as EndTransformer would pass), display is stripped
        // Becomes synchronous because the only import (runtime.ts) is stripped
        // language=JavaScript
        expect(definition.toString({stripDisplay: true})).toBe(`"1234",["jsx"],["input"],(jsx) => {
const display = Display.for("1234", _runtime_);
const input = display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input};
}`)
    });

    test("detects explicit view function from runtime import", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {view} from "@bodar/dataflow/runtime.ts";
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');

        expect(definition.hasExplicitView()).toBe(true);

        // With strip options (as EndTransformer would pass), view is stripped
        // Becomes synchronous because the only import (runtime.ts) is stripped
        // language=JavaScript
        expect(definition.toString({stripView: true})).toBe(`"1234",["jsx"],["input"],(jsx) => {
const view = View.for("1234", _runtime_);
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input};
}`)
    });

    test("detects view as unresolved reference (input parameter)", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');

        expect(definition.hasExplicitView()).toBe(true); // detected as input

        // With strip options, view is removed from inputs
        // language=JavaScript
        expect(definition.toString({stripView: true})).toBe(`"1234",["jsx"],["input"],(jsx) => {
const view = View.for("1234", _runtime_);
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input};
}`)
    });

    test("when the javascript is a single expression it has implicit display", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`<input name="name" type="text" value="Dan"/>`, '1234');
        expect(definition.hasImplicitDisplay()).toBe(true);
        expect(definition.hasDisplay()).toBe(true);
        // Implicit display still injects Display.for() and wraps in display()
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],[],(jsx) => {
const display = Display.for("1234", _runtime_);
return display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}))
}`);
    });

    test("any import becomes an output", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`import {Renderer} from "@bodar/dataflow/html/Renderer.ts";`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",[],["Renderer"],async() => {
const [{Renderer}] = await Promise.all([import('@bodar/dataflow/html/Renderer.ts')]);

return {Renderer};
}`)
    });

    test("still handles jsx as an arrow body", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`const greeting = (name) => <i>Hello {name}!</i>`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],["greeting"],(jsx) => {
const greeting = name => jsx.createElement("i", null, ["Hello ", name, "!"]);
return {greeting};
}`);
    });

    test("does not blow up with single for statement", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`for (let i = 0; i < 5; ++i) {alert(i);}`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["alert"],[],(alert) => {
for (let i = 0; i < 5; ++i) {alert(i);}
}`);
    });

    test("does not blow up with single block statement", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`{ if (typeof gc === 'function') gc(); }`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["gc"],[],(gc) => {
{if (typeof gc === 'function') gc();}
}`);
    });
});