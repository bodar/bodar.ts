import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../src/HTMLTransformer.ts";

describe("HTMLTransformer", () => {
    test("transforms a reactive script to a placeholder", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><slot name="vge10p"></slot><slot name="a"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
const renderer = new Renderer();
renderer.render("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
</script></body>`);
    });

    test("can transform multiple reactive scripts", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script><script reactive>const b = a + 1;</script></body>');
        expect(result).toBe(`<body><slot name="vge10p"></slot><slot name="a"></slot><slot name="vk6clg"></slot><slot name="b"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
const renderer = new Renderer();
renderer.render("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.render("vk6clg",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});
</script></body>`);
    });
});