import {beforeEach, describe, expect, test} from "bun:test";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";
import {display} from "../../src/api/display.ts";

describe("NodeDefinition", () => {
    beforeEach(() => {
        display.clear();
    });

    test("detects explicit display function usage", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {display} from "@bodar/dataflow/api/display.ts";
            const input = display(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],["input","Display"],async(jsx) => {
const [{Display}] = await Promise.all([import('@bodar/dataflow/api/display.ts')]);
const display = Display.for("1234");
const input = display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,Display};
}`)
    });

    test("detects explicit view function usage", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {view} from "@bodar/dataflow/api/view.ts";
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],["input","View"],async(jsx) => {
const [{View}] = await Promise.all([import('@bodar/dataflow/api/view.ts')]);
const view = View.for("1234");
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,View};
}`)
    });

    test("detects explicit view function usage even without an import", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["View","jsx"],["input"],(View,jsx) => {
const view = View.for("1234");
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input};
}`)
    });

    test("when the javascript is a single expression it has implicit display", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`<input name="name" type="text" value="Dan"/>`, '1234');
        expect(definition.hasImplicitDisplay()).toBe(true);
        expect(definition.hasDisplay()).toBe(true);
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],[],(jsx) => {
return jsx.createElement("input", {"name": "name","type": "text","value": "Dan"});
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