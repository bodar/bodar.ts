import {topologicalSort} from "./TopologicalSort.ts";
import {NodeDefinition} from "./NodeDefinition.ts";
import {HTMLTransformer} from "./HTMLTransformer.ts";
import {bundleText} from "../bundling/bundle.ts";

export class BodyTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.onEndTag(endTag => this.endTag(endTag));
    }

    async endTag(end: HTMLRewriterTypes.EndTag) {
        const sorted = topologicalSort(this.controller.definitions);
        // language=javascript
        const javascript = await bundleText(`import {Renderer, JSX2DOM} from "@bodar/dataflow/runtime.ts";
const renderer = new Renderer();
renderer.register("jsx", [], [], () => new JSX2DOM());
${sorted.map((d: NodeDefinition) => `renderer.register(${d});`).join('\n')}
renderer.render();`, 'js', import.meta.dir);
        end.before(`<script type="importmap">${JSON.stringify(this.importmap)}</script><script type="module">${javascript}</script>`, {html: true})
    }

    importmap = {
        imports: {
            "@bodar/": "/",
            "@observablehq/": "https://esm.run/@observablehq/"
        }
    }
}