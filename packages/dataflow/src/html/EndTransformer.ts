import {topologicalSort} from "./TopologicalSort.ts";
import {NodeDefinition, type SerializeOptions} from "./NodeDefinition.ts";
import {HTMLTransformer} from "./HTMLTransformer.ts";
import type {Bundler} from "../bundling/Bundler.ts";
import type {RuntimeConfig} from "../runtime.ts";

export class EndTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer, private bundler: Bundler) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        this.controller.pushScope();
        start.onEndTag(endTag => this.endTag(endTag));
    }

    async endTag(end: HTMLRewriterTypes.EndTag) {
        const definitions = this.controller.popDefinitions();
        if (definitions.length > 0) {
            const sorted = topologicalSort(definitions);

            // Check if any definition imports display/view from runtime
            const options: SerializeOptions = {
                stripDisplay: definitions.some(d => d.hasExplicitDisplay()),
                stripView: definitions.some(d => d.hasExplicitView()),
                stripWidth: definitions.some(d => d.hasWidth()),
            };

            const registrations = sorted.map((d: NodeDefinition) => {
                return (d.hasWidth() ? `_runtime_.graph.define("width_${d.key}",[],[],() => Width.for("${d.key}", _runtime_));` : '')
                    + `_runtime_.graph.define(${d.toString(options)});`;
            }).join('\n');
            const scriptId = this.controller.idGenerator.generate(registrations);
            const javascript = await this.bundler.transform(scriptTemplate({scriptId, idle: this.controller.idle}, registrations));
            end.before(`<script type="module" is="reactive-runtime" id="${scriptId}">${javascript}</script>`, {html: true})
        }
    }
}

export function scriptTemplate(config: RuntimeConfig, registrations: string): string {
    // language=javascript
    return `import {Display, View, Width, JSX2DOM, autoKeyEvents, runtime, chain} from "@bodar/dataflow/runtime.ts";
const _runtime_ = runtime(${JSON.stringify(config)}, globalThis);
_runtime_.graph.define("jsx", [], [], () => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis)));
_runtime_.graph.define("invalidator", [], [], () => _runtime_.invalidator);
${registrations}
_runtime_.graph.run();`;
}