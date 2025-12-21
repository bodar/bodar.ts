import {describe, expect, test} from "bun:test";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";
import {scriptTemplate} from "../../src/html/EndTransformer.ts";

describe("HTMLTransformer", () => {
    test("constants are not rendered, so no placeholder slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script></body>');
        expect(result).toBe(`<body><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });

    test("can transform multiple reactive scripts", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script><script data-reactive>const b = a + 1;</script></body>');
        expect(result).toBe(`<body><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});
_runtime_.graph.define("vk6clg_1",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});`)}</script></body>`);
    });

    test("single expressions will create a placeholder display slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive>const a = 1;</script><script data-reactive>`Some text ${a}`</script></body>');
        expect(result).toBe(`<body><slot name="4vhz4q_1"></slot><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});
_runtime_.graph.define("4vhz4q_1",["a"],[],(a) => {
const display = Display.for("4vhz4q_1", _runtime_);
return display(\`Some text \${a}\`)
});`)}</script></body>`);
    });

    test("can provide an id/key via HTML id attribute", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive id="constant">1</script></body>');
        expect(result).toBe(`<body><slot name="constant"></slot><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("constant",[],[],() => {
const display = Display.for("constant", _runtime_);
return display(1)
});`)}</script></body>`);
    });

    test("if the javascript is invalid, report the error in the slot", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive>=</script></body>');
        expect(result).toBe(`<body><slot name="00001p_0"></slot><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("00001p_0",[],[],() => {
const display = Display.for("00001p_0", _runtime_);
return display("Unexpected token (1:0)")
});`)}</script></body>`);
    });

    test("can use an import inside a cell", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform(`<body><script type="module" data-reactive>
import {iterator} from "@bodar/dataflow/observe.ts";
const input = <input name="name" type="text" />;
const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data)}), input.value);
</script></body>`);

        expect(result).toBe(`<body><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("uf397b_0",["jsx"],["input","name","iterator"],async(jsx) => {
const [{iterator}] = await Promise.all([import('@bodar/dataflow/observe.ts')]);
const input = jsx.createElement("input", {"name": "name","type": "text"});const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data);}), input.value);
return {input,name,iterator};
});`)}</script></body>`
        );
    });

    test("data-echo inserts escaped code block after output", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script type="module" data-reactive data-echo>1 + 2</script></body>');

        expect(result).toBe(`<body><pre><code class="language-javascript">1 + 2</code></pre><slot name="0rj9ce_0"></slot><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("0rj9ce_0",[],[],() => {
const display = Display.for("0rj9ce_0", _runtime_);
return display(1 + 2)
});`)}</script></body>`);
    });

    test("data-echo is not included when not present", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script data-reactive>1 + 2</script></body>');

        expect(result).not.toContain('<pre><code');
    });

    test('can use is="reactive" attribute instead of data-reactive', async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script is="reactive">const a = 1;</script></body>');
        expect(result).toBe(`<body><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });

    test('can use is="reactive-island" determine where graph code is placed', async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><div is="reactive-island"><script is="reactive">const a = 1;</script></div></body>');
        expect(result).toBe(`<body><div is="reactive-island"><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });

    test('supports multiple isolated reactive islands on the same page', async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><div id="one" is="reactive-island"><script is="reactive">const a = 1;</script></div><div id="two" is="reactive-island"><script is="reactive">const a = 1;</script></div></body>');
        expect(result).toBe(`<body><div id="one" is="reactive-island"><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div><div id="two" is="reactive-island"><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_1",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });


    test('can use custom selector to determine where graph code is placed', async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), selectors: {end: '#my-component'}});
        const result = transformer.transform('<body><div id="my-component"><script is="reactive">const a = 1;</script></div></body>');
        expect(result).toBe(`<body><div id="my-component"><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });

    test('supports nested reactive islands with isolated scopes', async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        const result = transformer.transform('<body><script is="reactive">const a = 1;</script><div is="reactive-island"><script is="reactive">const b = 2;</script></div></body>');
        // Inner island should have only 'b', outer body should have only 'a'
        expect(result).toBe(`<body><div is="reactive-island"><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vxfnfr_1",[],["b"],() => {
const b = 2;
return {b};
});`)}</script></div><script type="module" is="reactive-runtime">${scriptTemplate(`_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });
});