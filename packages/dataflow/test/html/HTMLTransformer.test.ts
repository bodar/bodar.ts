import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";
import {Bundler} from "../../src/bundling/Bundler.ts";

describe("HTMLTransformer", () => {
    test("constants are not rendered, so no placeholder slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.render();</script></body>`);
    });

    test("can transform multiple reactive scripts", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script><script data-reactive>const b = a + 1;</script></body>');
        expect(result).toBe(`<body><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.register("vk6clg",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});
renderer.render();</script></body>`);
    });

    test("single expressions will create a placeholder display slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script><script data-reactive>`Some text ${a}`</script></body>');
        expect(result).toBe(`<body><slot name="_display_4vhz4q"></slot><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("vge10p",[],["a"],() => {
const a = 1;
return {a};
});
renderer.register("_display_4vhz4q",["a"],[],(a) => \`Some text \${a}\`);
renderer.render();</script></body>`);
    });

    test("can provide an id/key via HTML id attribute", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive id="constant">1</script></body>');
        expect(result).toBe(`<body><slot name="_display_constant"></slot><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("_display_constant",[],[],() => 1);
renderer.render();</script></body>`);
    });

    test("if the javascript is invalid, report the error in the slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive>=</script></body>');
        expect(result).toBe(`<body><slot name="_display_00001p"></slot><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("_display_00001p",[],[],() => "Unexpected token (1:0)");
renderer.render();</script></body>`);
    });

    test("can use an import inside a cell", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform(`<body><script type="module" data-reactive>
import {iterator} from "@bodar/dataflow/observe.ts";
const input = <input name="name" type="text" />;
const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data)}), input.value);
</script></body>`);

        expect(result).toBe(`<body><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("uf397b",["jsx"],["input","name","iterator"],async(jsx) => {
const [{iterator}] = await Promise.all([import('@bodar/dataflow/observe.ts')]);
const input = jsx.createElement("input", {"name": "name","type": "text"});const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data);}), input.value);
return {input,name,iterator};
});
renderer.render();</script></body>`
        );
    });

    test("data-echo inserts escaped code block after output", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script type="module" data-reactive data-echo>1 + 2</script></body>');

        expect(result).toBe(`<body><pre><code class="language-javascript">1 + 2</code></pre><slot name="_display_0rj9ce"></slot><script type="module">import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
renderer.register("_display_0rj9ce",[],[],() => 1 + 2);
renderer.render();</script></body>`);
    });

    test("data-echo is not included when not present", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
        const result = transformer.transform('<body><script data-reactive>1 + 2</script></body>');

        expect(result).not.toContain('<pre><code');
        expect(result).not.toContain('hljs');
        expect(result).not.toContain('highlight.js');
    });
});