import {describe, test} from "bun:test";
import {parseHTML} from "linkedom";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";
import {Bundler} from "../../src/bundling/Bundler.ts";
import {assertThat} from "@bodar/totallylazy/asserts/assertThat.ts";
import {is} from "@bodar/totallylazy/predicates/IsPredicate.ts";
import {NodeDefinition} from "../../src/html/NodeDefinition.ts";
import html from "../../docs/examples/todo.html" with {type: 'text'}


async function renderHTML(html: string, global: any = globalThis): Promise<Window & typeof globalThis> {
    const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), bundler: Bundler.noOp});
    const reactive = transformer.transform(html);
    const browser = parseHTML(reactive);

    await Promise.all(Array.from(browser.document.querySelectorAll('script[type=module]')).map(async (script) => {
        const definition = NodeDefinition.parse(script.textContent);
        const fun = new Function(...definition.inputs, `return (${definition.fun()})(${definition.inputs.join(',')});`);
        await fun(...definition.inputs.map(i => {
            if (i === 'globalThis') return browser;
            return Reflect.get(browser, i) || Reflect.get(global, i);
        }));
    }))

    await new Promise(resolve => setTimeout(resolve, 0))
    return browser;
}

describe("todo", () => {
    test("can render the 3 built in todos", async () => {
        const browser = await renderHTML(html as any);
        assertThat(Array.from(browser.document.querySelectorAll('.todo-item')).length, is(3));
    });
});