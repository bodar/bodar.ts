import {topologicalSort} from "./TopologicalSort.ts";
import {NodeDefinition, type SerializeOptions} from "./NodeDefinition.ts";
import {HTMLTransformer} from "./HTMLTransformer.ts";
import type {Bundler} from "../bundling/Bundler.ts";

export class EndTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer, private bundler: Bundler) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        this.controller.pushScope();
        start.onEndTag(endTag => this.endTag(endTag));
    }

    async endTag(end: HTMLRewriterTypes.EndTag) {
        const definitions = this.controller.popDefinitions();
        if(definitions.length > 0) {
            const sorted = topologicalSort(definitions);

            // Check if any definition imports display/view from runtime
            const options: SerializeOptions = {
                stripDisplay: definitions.some(d => d.hasExplicitDisplay()),
                stripView: definitions.some(d => d.hasExplicitView())
            };

            const registrations = sorted.map((d: NodeDefinition) => `renderer.register(${d.toString(options)});`).join('\n');
            const javascript = await this.bundler.transform(scriptTemplate(registrations));
            end.before(`<script type="module">${javascript}</script>`, {html: true})
        }
    }
}

export function scriptTemplate(registrations: string):string {
    // language=javascript
    return `import {Display, View, Renderer, JSX2DOM, BaseGraph, Idle, Throttle, chain} from "@bodar/dataflow/runtime.ts";
    const throttle = Throttle.auto();
    const idle = new Idle(throttle);
    const graph = new BaseGraph(undefined, idle.strategy, globalThis);
    const renderer = new Renderer(chain(globalThis, {graph}));
    renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
    ${registrations}
    renderer.render();`;
}