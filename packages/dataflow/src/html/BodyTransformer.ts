import {topologicalSort} from "./TopologicalSort.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";
import {NodeDefinition} from "./NodeDefinition.ts";
import {HTMLTransformer} from "./HTMLTransformer.ts";

export class BodyTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.onEndTag(endTag => this.endTag(endTag));
    }

    endTag(end: HTMLRewriterTypes.EndTag) {
        const sorted = topologicalSort(this.controller.definitions);
        end.before(`<script type="importmap">${JSON.stringify(this.importmap)}</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/html/Renderer.ts";
import {${JSX2DOM.name}} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
${sorted.map((d: NodeDefinition) => `renderer.register(${d});`).join('\n')}
renderer.render();
</script>`, {html: true})
    }

    importmap = {
        imports: {
            "@bodar/": "/",
            "@observablehq/": "https://esm.run/@observablehq/"
        }
    }
}