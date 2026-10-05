import {describe, expect, test} from "bun:test";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";
import {topologicalSort} from "../../src/html/TopologicalSort.ts";

const parse = (javascript: string, key: string) => NodeDefinition.parse(javascript, key);

describe("topologicalSort", () => {
    test("orders blocks by dependency", () => {
        const sorted = topologicalSort([parse("const b = a + 1;", "second"), parse("const a = 1;", "first")]);
        expect(sorted.map(d => d.key)).toEqual(["first", "second"]);
    });

    test("a cycle between blocks names the blocks and the values that close it", () => {
        expect(() => topologicalSort([parse("const a = b + 1;", "blockA"), parse("const b = a + 1;", "blockB"), parse("const c = 1;", "blockC")]))
            .toThrow(`Circular dependency: block blockA needs 'b' from block blockB, which needs 'a' from block blockA`);
    });

    test("a closure can use a value declared later in the same block", () => {
        expect(topologicalSort([parse("const f = () => g(); const g = 1;", "blockF")]).map(d => d.key)).toEqual(["blockF"]);
    });
});
