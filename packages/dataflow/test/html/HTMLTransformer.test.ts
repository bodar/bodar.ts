import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";

describe("HTMLTransformer", () => {
    test("constants are not rendered, so no placeholder slot", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.render();
</script></body>`);
    });

    test("can transform multiple reactive scripts", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script><script reactive>const b = a + 1;</script></body>');
        expect(result).toBe(`<body><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.register("vk6clg",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});
renderer.render();
</script></body>`);
    });

    test("single expressions will create a placeholder display slot", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script><script reactive>`Some text ${a}`</script></body>');
        expect(result).toBe(`<body><slot name="_display_4vhz4q"></slot><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.register("_display_4vhz4q",["a"],[],(a) => \`Some text \${a}\`);
renderer.render();
</script></body>`);
    });

    test("can provide an id/key via HTML id attribute", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive id="constant">1</script></body>');
        expect(result).toBe(`<body><slot name="_display_constant"></slot><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("_display_constant",[],[],() => 1);
renderer.render();
</script></body>`);
    });

    test("if the javascript is invalid, report the error in the slot", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>=</script></body>');
        expect(result).toBe(`<body><slot name="_display_00001p"></slot><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("_display_00001p",[],[],() => "Unexpected token (1:0)");
renderer.render();
</script></body>`);
    });

    test("can use an import inside a cell", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform(`<body><script type="module" reactive>
import {iterator} from "@bodar/dataflow/Iterator.ts";
const input = <input name="name" type="text" />;
const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data)}), input.value);
</script></body>`);


        expect(result).toBe(`<body><script type="importmap">{"imports":{"@bodar/":"/","@observablehq/":"https://esm.run/@observablehq/"}}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("tubt3x",[],["input","name"],async() => {
const [{iterator}] = await Promise.all([import('@bodar/dataflow/Iterator.ts')]);
const input = jsx.createElement("input", {"name": "name","type": "text"});const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data);}), input.value);
return {input,name};
});
renderer.render();
</script></body>`
        );
    });
});