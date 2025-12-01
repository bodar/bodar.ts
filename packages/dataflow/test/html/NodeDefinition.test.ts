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
        expect(definition.toString()).toBe(`"1234",["jsx"],["input","display","_display_1234"],async(jsx) => {
const [{display}] = await Promise.all([import('@bodar/dataflow/api/display.ts')]);
const input = display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,display,_display_1234:display.pop()};
}`)
    });

    test("detects explicit view function usage", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {view} from "@bodar/dataflow/api/view.ts";
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["jsx"],["input","view","_display_1234"],async(jsx) => {
const [{view}] = await Promise.all([import('@bodar/dataflow/api/view.ts')]);
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,view,_display_1234:view.pop()};
}`)
    });

    test("detects explicit view function usage even without an import", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            const input = view(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",["view","jsx"],["input","_display_1234"],(view,jsx) => {
const input = view(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,_display_1234:view.pop()};
}`)
    });

    test("when the javascript is a single expression, prefix the key with _display_", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`<input name="name" type="text" value="Dan"/>`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"_display_1234",["jsx"],[],(jsx) => jsx.createElement("input", {"name": "name","type": "text","value": "Dan"})`);
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
const greeting = name => jsx.createElement("i", null, ["Hello", name, "!"]);
return {greeting};
}`);
    });
});