/**
 * Function that allows rendering and executing pf reactive blocks in HTML, Bring your own DOM parser (we use linkedom)
 * @module
 */

import type {Idle} from "./Idle.ts";
import type {BaseGraph} from "../BaseGraph.ts";
import {HTMLTransformer} from "../html/HTMLTransformer.ts";
import {chain} from "@bodar/yadic/chain.ts";
import {NodeDefinition} from "../html/NodeDefinition.ts";

const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;

export async function renderAndExecute(htmlParser: (html: string) => (Window & typeof globalThis), html: string, global: any = globalThis): Promise<{
    browser: (Window & typeof globalThis),
    idle: Idle,
    graph: BaseGraph
}> {
    const transformer = new HTMLTransformer({rewriter: new HTMLRewriter(), idle: true});
    const reactive = transformer.transform(html);
    const browser = htmlParser(reactive);
    const g = chain(browser, global)

    const module = browser.document.querySelector('script[type=module][is=reactive-runtime]')!;
    const definition = NodeDefinition.parse(module.textContent);
    const fun = new AsyncFunction(...definition.inputs, definition.body());
    const {_runtime_} = await fun(...definition.inputs.map(i => {
        if (i === 'globalThis') return g;
        return Reflect.get(g, i);
    }));
    await new Promise(resolve => setTimeout(resolve, 0));
    return {browser, idle: _runtime_.idle, graph: _runtime_.graph};
}