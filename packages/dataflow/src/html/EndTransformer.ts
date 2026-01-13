import {topologicalSort} from "./TopologicalSort.ts";
import {NodeDefinition} from "./NodeDefinition.ts";
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

            const imports = new Set<string>(['runtime']);
            for (const d of sorted) {
                for (const imp of d.getUsedDirectImports()) imports.add(imp);
                if (d.hasDisplay()) imports.add('Display');
                if (d.hasExplicitView()) imports.add('View');
                if (d.hasWidth()) imports.add('Width');
                if (d.hasJsx()) imports.add('JSX2DOM').add('autoKeyEvents').add('chain');
            }

            const registrations = [
                imports.has('JSX2DOM') && `_runtime_.graph.define("jsx",[],[],() => new JSX2DOM(chain({onEventListener: autoKeyEvents()}, globalThis)));`,
                ...sorted.flatMap((d: NodeDefinition) => [
                    d.hasWidth() && `_runtime_.graph.define("width_${d.key}",[],[],() => Width.for("${d.key}", _runtime_));`,
                    `_runtime_.graph.define(${d.toString()});`
                ])
            ].filter(Boolean).join('\n');
            const scriptId = this.controller.idGenerator.generate(registrations);
            const javascript = await this.bundler.transform(scriptTemplate({scriptId, idle: this.controller.idle}, imports, registrations));
            end.before(`<script type="module" is="reactive-runtime" id="${scriptId}">${javascript}</script>`, {html: true})
        }
    }
}

export function scriptTemplate(config: RuntimeConfig, imports: Set<string>, registrations: string): string {
    // language=javascript
    return `import {${([...imports].join(','))}} from "@bodar/dataflow/runtime.ts";
const _runtime_ = runtime(${JSON.stringify(config)}, globalThis);
${registrations}
_runtime_.graph.run();`;
}