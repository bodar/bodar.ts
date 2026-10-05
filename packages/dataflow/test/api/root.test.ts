import {describe, expect, test} from "bun:test";
import {parseHTML} from "linkedom";
import {curry} from "@bodar/totallylazy/functions/curry.ts";
import {renderAndExecute} from "../../src/testing/renderAndExecute.ts";
import {HTMLTransformer} from "../../src/html/HTMLTransformer.ts";

const renderHTML = curry(renderAndExecute)(parseHTML)

describe("root", () => {
    test("is the element of the reactive island the block lives in", async () => {
        const {browser} = await renderHTML('<body><div id="island" is="reactive-island"><p><script is="reactive">root.id</script></p></div></body>' as any);
        expect(browser.document.querySelector('#island p')!.textContent).toBe('island');
    });

    test("is only defined when a block uses it", async () => {
        const transformer = new HTMLTransformer({rewriter: new HTMLRewriter()});
        expect(await transformer.transform('<body><script is="reactive">root.id</script></body>'))
            .toContain('_runtime_.graph.define("root",[],[],() => _runtime_.reactiveRoot);');
        expect(await transformer.transform('<body><script is="reactive">const a = 1;</script></body>'))
            .not.toContain('"root"');
    });
});
