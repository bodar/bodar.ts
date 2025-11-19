import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../src/HTMLTransformer.ts";

describe("HTMLTransformer", () => {
    test("transforms a reactive script to a placeholder", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><!--?placeholder id="vge10p"?--><script type="module">
import {Graph} from "@bodar/dataflow/Graph.ts";
const graph = new Graph();
graph.define("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
</script></body>`);
    });

    test.only("can transform multiple reactive scripts", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script><script reactive>const b = a + 1;</script></body>');
        expect(result).toBe(`<body><!--?placeholder id="vge10p"?--><!--?placeholder id="vk6clg"?--><script type="module">
import {Graph} from "@bodar/dataflow/Graph.ts";
const graph = new Graph();
graph.define("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
graph.define("vk6clg",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});
</script></body>`);
    });
});