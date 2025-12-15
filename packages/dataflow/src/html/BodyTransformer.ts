import {topologicalSort} from "./TopologicalSort.ts";
import {NodeDefinition} from "./NodeDefinition.ts";
import {HTMLTransformer} from "./HTMLTransformer.ts";
import type {Bundler} from "../bundling/Bundler.ts";

export class BodyTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer, private bundler: Bundler) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.onEndTag(endTag => this.endTag(endTag));
    }

    async endTag(end: HTMLRewriterTypes.EndTag) {
        const sorted = topologicalSort(this.controller.popDefinitions());
        // language=javascript
        const javascript = await this.bundler.transform(`import {Renderer, rendererDependencies, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer(rendererDependencies(globalThis));
renderer.register("jsx", [], [], () => new JSX2DOM(globalThis));
${sorted.map((d: NodeDefinition) => `renderer.register(${d});`).join('\n')}
renderer.render();`);
        end.before(`<script type="module">${javascript}</script>`, {html: true})
    }
}