import {describe, expect, test} from "bun:test";
import {parseHTML} from "linkedom";
import {DOMTransformer} from "../../src/html/DOMTransformer.ts";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";
import {scriptTemplate} from "../../src/html/TransformationController.ts";
import {SimpleHashGenerator} from "../../src/IdGenerator.ts";

// Note: HTMLTransformer is only imported for contract tests, not as a dependency of DOMTransformer

const emptyImports = new Set(['runtime']);
const displayImports = new Set(['runtime', 'Display']);
const jsxImports = new Set(['runtime', 'JSX2DOM', 'autoKeyEvents', 'chain']);

/** Helper to transform HTML using DOMTransformer and return the result as a string */
async function transformWithDOM(html: string, options: ConstructorParameters<typeof DOMTransformer>[0] = {}): Promise<string> {
    const {document} = parseHTML(html);
    const transformer = new DOMTransformer(options);
    await transformer.transform(document);
    // linkedom quirk: document.body may not be the outer body, so use querySelector
    // Also strip the extra <head></head><body></body> that linkedom adds
    const body = document.querySelector('body');
    const outerHtml = body?.outerHTML ?? document.toString();
    // Remove linkedom's extra structure
    return outerHtml.replace(/<head><\/head><body><\/body>/g, '');
}

/** Normalize HTML for comparison by sorting attributes alphabetically */
function normalizeHtml(html: string): string {
    // Sort attributes within tags to make comparison order-independent
    return html.replace(/<(\w+)([^>]*)>/g, (match, tag, attrs) => {
        if (!attrs.trim()) return match;
        const attrMatches = attrs.match(/\s+[\w-]+(?:="[^"]*")?/g) || [];
        const sortedAttrs = attrMatches.sort().join('');
        return `<${tag}${sortedAttrs}>`;
    });
}

/** Compare two HTML strings with normalized attribute order */
function expectHtmlEqual(actual: string, expected: string) {
    expect(normalizeHtml(actual)).toBe(normalizeHtml(expected));
}

describe("DOMTransformer", () => {
    test("constants are not rendered, so no placeholder slot", async () => {
        const result = await transformWithDOM('<body><script data-reactive>const a = 1;</script></body>');
        expectHtmlEqual(result, `<body><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });

    test("can transform multiple reactive scripts", async () => {
        const result = await transformWithDOM('<body><script data-reactive>const a = 1;</script><script data-reactive>const b = a + 1;</script></body>');
        expectHtmlEqual(result, `<body><script type="module" is="reactive-runtime" id="v88umo_2">${scriptTemplate({scriptId: 'v88umo_2', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});
_runtime_.graph.define("vk6clg_1",["a"],["b"],(a) => {
const b = a + 1;
return {b};
});`)}</script></body>`);
    });

    test("single expressions will create a placeholder display slot", async () => {
        const result = await transformWithDOM('<body><script data-reactive>const a = 1;</script><script data-reactive>`Some text ${a}`</script></body>');
        expectHtmlEqual(result, `<body><slot name="4vhz4q_1"></slot><script type="module" is="reactive-runtime" id="izknfa_2">${scriptTemplate({scriptId: 'izknfa_2', idle: false}, displayImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});
_runtime_.graph.define("4vhz4q_1",["a"],[],(a) => {
const display = Display.for("4vhz4q_1", _runtime_);
return display(\`Some text \${a}\`)
});`)}</script></body>`);
    });

    test("can provide an id/key via HTML id attribute", async () => {
        const result = await transformWithDOM('<body><script data-reactive id="constant">1</script></body>');
        expectHtmlEqual(result, `<body><slot name="constant"></slot><script type="module" is="reactive-runtime" id="z6unte_0">${scriptTemplate({scriptId: 'z6unte_0', idle: false}, displayImports, `_runtime_.graph.define("constant",[],[],() => {
const display = Display.for("constant", _runtime_);
return display(1)
});`)}</script></body>`);
    });

    test("if the javascript is invalid, report the error in the slot", async () => {
        const result = await transformWithDOM('<body><script data-reactive>=</script></body>');
        expectHtmlEqual(result, `<body><slot name="00001p_0"></slot><script type="module" is="reactive-runtime" id="t4zik1_1">${scriptTemplate({scriptId: 't4zik1_1', idle: false}, displayImports, `_runtime_.graph.define("00001p_0",[],[],() => {
const display = Display.for("00001p_0", _runtime_);
return display("Unexpected token (1:0)")
});`)}</script></body>`);
    });

    test("can use an import inside a cell", async () => {
        const result = await transformWithDOM(`<body><script type="module" data-reactive>
import {iterator} from "@bodar/dataflow/observe.ts";
const input = <input name="name" type="text" />;
const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data)}), input.value);
</script></body>`);

        expectHtmlEqual(result, `<body><script type="module" is="reactive-runtime" id="mct9x4_1">${scriptTemplate({scriptId: 'mct9x4_1', idle: false}, jsxImports, `_runtime_.graph.define("jsx",[],[],() => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis)));
_runtime_.graph.define("uf397b_0",["jsx"],["input","name","iterator"],async(jsx) => {
const [{iterator}] = await Promise.all([import('@bodar/dataflow/observe.ts')]);
const input = jsx.createElement("input", {"name": "name","type": "text"});const name = iterator(notify => input.addEventListener('input', ev => {notify(ev.data);}), input.value);
return {input,name,iterator};
});`)}</script></body>`
        );
    });

    test("data-echo inserts escaped code block after output", async () => {
        const result = await transformWithDOM('<body><script type="module" data-reactive data-echo>1 + 2</script></body>');

        expectHtmlEqual(result, `<body><pre><code class="language-javascript">1 + 2</code></pre><slot name="0rj9ce_0"></slot><script type="module" is="reactive-runtime" id="8mkckx_1">${scriptTemplate({scriptId: '8mkckx_1', idle: false}, displayImports, `_runtime_.graph.define("0rj9ce_0",[],[],() => {
const display = Display.for("0rj9ce_0", _runtime_);
return display(1 + 2)
});`)}</script></body>`);
    });

    test("data-echo is not included when not present", async () => {
        const result = await transformWithDOM('<body><script data-reactive>1 + 2</script></body>');

        expect(result).not.toContain('<pre><code');
    });

    test('can use is="reactive" attribute instead of data-reactive', async () => {
        const result = await transformWithDOM('<body><script is="reactive">const a = 1;</script></body>');
        expectHtmlEqual(result, `<body><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });

    test('can use is="reactive-island" determine where graph code is placed', async () => {
        const result = await transformWithDOM('<body><div is="reactive-island"><script is="reactive">const a = 1;</script></div></body>');
        expectHtmlEqual(result, `<body><div is="reactive-island"><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });

    test('supports multiple isolated reactive islands on the same page', async () => {
        const result = await transformWithDOM('<body><div id="one" is="reactive-island"><script is="reactive">const a = 1;</script></div><div id="two" is="reactive-island"><script is="reactive">const a = 1;</script></div></body>');
        expectHtmlEqual(result, `<body><div id="one" is="reactive-island"><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div><div id="two" is="reactive-island"><script type="module" is="reactive-runtime" id="pbmmz3_3">${scriptTemplate({scriptId: 'pbmmz3_3', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_2",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });

    test('can use custom selector to determine where graph code is placed', async () => {
        const result = await transformWithDOM('<body><div id="my-component"><script is="reactive">const a = 1;</script></div></body>', {selectors: {end: '#my-component'}});
        expectHtmlEqual(result, `<body><div id="my-component"><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></div></body>`);
    });

    test('supports nested reactive islands with isolated scopes', async () => {
        const result = await transformWithDOM('<body><script is="reactive">const a = 1;</script><div is="reactive-island"><script is="reactive">const b = 2;</script></div></body>');
        // Inner island should have only 'b', outer body should have only 'a'
        expectHtmlEqual(result, `<body><div is="reactive-island"><script type="module" is="reactive-runtime" id="s6yqeh_2">${scriptTemplate({scriptId: 's6yqeh_2', idle: false}, emptyImports, `_runtime_.graph.define("vxfnfr_1",[],["b"],() => {
const b = 2;
return {b};
});`)}</script></div><script type="module" is="reactive-runtime" id="dmyfzn_3">${scriptTemplate({scriptId: 'dmyfzn_3', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });

    test('supports custom type transformers', async () => {
        const result = await transformWithDOM('<body><script type="sql" is="reactive" id="query">SELECT * FROM users</script></body>', {
            typeTransformers: {
                'sql': (content, _attributes, key) => `const ${key}_result = executeSql(\`${content}\`);`
            }
        });
        // Transformer converts SQL to JS, which then gets parsed for inputs/outputs
        expect(result).toContain('_runtime_.graph.define("query",["executeSql"],["query_result"]');
        expect(result).toContain('const query_result = executeSql(`SELECT * FROM users`);');
    });

    test('type transformer receives attributes and key', async () => {
        let receivedContent: string | undefined;
        let receivedAttributes: Map<string, string> | undefined;
        let receivedKey: string | undefined;

        await transformWithDOM('<body><script type="custom" is="reactive" id="mykey" data-foo="bar">some content</script></body>', {
            typeTransformers: {
                'custom': (content, attributes, key) => {
                    receivedContent = content;
                    receivedAttributes = attributes;
                    receivedKey = key;
                    return 'const x = 1;';
                }
            }
        });

        expect(receivedContent).toBe('some content');
        expect(receivedKey).toBe('mykey');
        expect(receivedAttributes?.get('type')).toBe('custom');
        expect(receivedAttributes?.get('data-foo')).toBe('bar');
    });

    test('unregistered types pass through as JavaScript', async () => {
        const result = await transformWithDOM('<body><script type="unknown" is="reactive">const a = 1;</script></body>');
        expectHtmlEqual(result, `<body><script type="module" is="reactive-runtime" id="dmyfzn_1">${scriptTemplate({scriptId: 'dmyfzn_1', idle: false}, emptyImports, `_runtime_.graph.define("vge10p_0",[],["a"],() => {
const a = 1;
return {a};
});`)}</script></body>`);
    });
});

describe("DOMTransformer vs HTMLTransformer contract", () => {
    const testCases = [
        '<body><script data-reactive>const a = 1;</script></body>',
        '<body><script data-reactive>const a = 1;</script><script data-reactive>const b = a + 1;</script></body>',
        '<body><script data-reactive>const a = 1;</script><script data-reactive>`Some text ${a}`</script></body>',
        '<body><script data-reactive id="constant">1</script></body>',
        '<body><script is="reactive">const a = 1;</script></body>',
        '<body><div is="reactive-island"><script is="reactive">const a = 1;</script></div></body>',
        '<body><div id="one" is="reactive-island"><script is="reactive">const a = 1;</script></div><div id="two" is="reactive-island"><script is="reactive">const a = 1;</script></div></body>',
        '<body><script is="reactive">const a = 1;</script><div is="reactive-island"><script is="reactive">const b = 2;</script></div></body>',
    ];

    for (const html of testCases) {
        test(`produces identical output for: ${html.slice(0, 60)}...`, async () => {
            // Use SimpleHashGenerator to avoid ID ordering differences between streaming and batch processing
            const htmlTransformer = new HTMLTransformer({rewriter: new HTMLRewriter(), idGenerator: SimpleHashGenerator});
            const htmlResult = htmlTransformer.transform(html);

            const {document} = parseHTML(html);
            const domTransformer = new DOMTransformer({idGenerator: SimpleHashGenerator});
            await domTransformer.transform(document);
            const body = document.querySelector('body');
            const domResult = body?.outerHTML.replace(/<head><\/head><body><\/body>/g, '') ?? '';

            // Normalize both outputs for comparison (attribute order may differ)
            expect(normalizeHtml(domResult)).toBe(normalizeHtml(htmlResult));
        });
    }
});
