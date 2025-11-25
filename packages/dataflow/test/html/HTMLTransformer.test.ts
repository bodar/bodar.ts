import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";

describe("HTMLTransformer", () => {
    test("transforms a reactive script to a placeholder", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><slot name="vge10p"></slot><slot name="a"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
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
        expect(result).toBe(`<body><slot name="vge10p"></slot><slot name="a"></slot><slot name="vk6clg"></slot><slot name="b"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
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

    test("can transform reactive scripts that have no explicit outputs into a lambda", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>const a = 1;</script><script reactive>`Some text ${a}`</script></body>');
        expect(result).toBe(`<body><slot name="vge10p"></slot><slot name="a"></slot><slot name="4vhz4q"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.register("4vhz4q",["a"],[],(a) => \`Some text \${a}\`);
renderer.render();
</script></body>`);
    });

    test("can provide an id/key via HTML id attribute", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive id="constant">1</script></body>');
        expect(result).toBe(`<body><slot name="constant"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("constant",[],[],() => 1);
renderer.render();
</script></body>`);
    });

    test("if the javascript is invalid, report the error in the slot", async () => {
        const transformer = new HTMLTransformer(new HTMLRewriter());
        const result = transformer.transform('<body><script reactive>=</script></body>');
        expect(result).toBe(`<body><slot name="00001p"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
renderer.register("00001p",[],[],() => "Unexpected token (1:0)");
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


        expect(result).toBe(`<body><slot name="tubt3x"></slot><slot name="input"></slot><slot name="name"></slot><script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
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