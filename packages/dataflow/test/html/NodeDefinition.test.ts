import {beforeEach, describe, expect, test} from "bun:test";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";
import {display} from "../../src/api/display.ts";

describe("NodeDefinition", () => {
    beforeEach(() => {
        display.clear();
    });

    test("detects the usage of the display function", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`
            import {display} from "@bodar/dataflow/api/display.ts";
            const input = display(<input name="name" type="text" value="Dan"/>);
        `, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"1234",[],["input","_display_1234"],async() => {
const [{display}] = await Promise.all([import('@bodar/dataflow/api/display.ts')]);
const input = display(jsx.createElement("input", {"name": "name","type": "text","value": "Dan"}));
return {input,_display_1234:display.pop()};
}`)
    });

    test("when the javascript is a single expression, prefix the key with _display_", async () => {
        // language=JavaScript
        const definition = NodeDefinition.parse(`<input name="name" type="text" value="Dan"/>`, '1234');
        // language=JavaScript
        expect(definition.toString()).toBe(`"_display_1234",[],[],() => jsx.createElement("input", {"name": "name","type": "text","value": "Dan"})`);
    });
});