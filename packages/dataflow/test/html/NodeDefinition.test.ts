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
const display = Display.for("1234", _runtime_);
const view = View.for(display);
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
const display = Display.for("1234", _runtime_);
const view = View.for(display);
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
        const definition = NodeDefinition.parse(`import {Renderer} from "@bodar/dataflow/html/HTMLTransformer.ts";`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",[],["Renderer"],async() => {
const [{Renderer}] = await Promise.all([import('@bodar/dataflow/html/HTMLTransformer.ts')]);

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

    test("detects top-level await expression", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`const response = await fetch(url);`, '1234');
        expect(definition.isAsync()).toBe(true);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["fetch","url"],["response"],async(fetch,url) => {
const response = await fetch(url);
return {response};
}`);
    });

    test("detects multiple top-level await expressions", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const response = await fetch(url);
            const data = await response.json();
        `, '1234');
        expect(definition.isAsync()).toBe(true);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["fetch","url"],["response","data"],async(fetch,url) => {
const response = await fetch(url);const data = await response.json();
return {response,data};
}`);
    });

    test("detects for await...of loop", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const values = [];
            for await (const value of asyncIterable) values.push(value);
        `, '1234');
        expect(definition.isAsync()).toBe(true);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["asyncIterable"],["values"],async(asyncIterable) => {
const values = [];for await (const value of asyncIterable) values.push(value);
return {values};
}`);
    });

    test("await inside nested arrow function does NOT make block async", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const fn = async () => await fetch(url);
        `, '1234');
        expect(definition.isAsync()).toBe(false);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["fetch","url"],["fn"],(fetch,url) => {
const fn = async () => await fetch(url);
return {fn};
}`);
    });

    test("await inside class method does NOT make block async", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            class Fetcher {
                async fetch() { return await getData(); }
            }
        `, '1234');
        expect(definition.isAsync()).toBe(false);
    });

    test("detects function declaration as output", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`function greet(name) { return 'Hello ' + name; }`, '1234');
        expect(definition.outputs).toEqual(['greet']);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",[],["greet"],() => {
function greet(name) {return 'Hello ' + name;}
return {greet};
}`);
    });

    test("detects class declaration as output", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`class Greeter { greet(name) { return 'Hello ' + name; } }`, '1234');
        expect(definition.outputs).toEqual(['Greeter']);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",[],["Greeter"],() => {
class Greeter {greet(name) {return 'Hello ' + name;}}
return {Greeter};
}`);
    });

    test("explicit display with multiple statements should not wrap in implicit display", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            if (state !== 'closed') {
                display(<div>Controls</div>)
            }
            display(<dl><dt>Status</dt></dl>);
        `, '1234');

        expect(definition.hasExplicitDisplay()).toBe(true);
        expect(definition.hasImplicitDisplay()).toBe(false);
        // Should NOT wrap body in return display(...) - that would produce invalid JS
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["state","display","jsx"],[],(state,display,jsx) => {
const display = Display.for("1234", _runtime_);
if (state !== 'closed') {display(jsx.createElement("div", null, ["Controls"]));}display(jsx.createElement("dl", null, [jsx.createElement("dt", null, ["Status"])]));
}`);
    });
});