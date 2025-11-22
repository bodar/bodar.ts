/** @module
 * Module
 * **/
import {simpleHash} from "./simpleHash.ts";
import {
    findTopLevelVariableDeclarations,
    findUnresolvedReferences,
    parseScript,
    processJSX
} from "./function-parsing.ts";
import {topologicalSort} from "./TopologicalSort.ts";
import {JSX2DOM} from "@bodar/jsx2dom/JSX2DOM.ts";

/** A definition of a Node but still in raw text format */
export class NodeDefinition {
    constructor(public key: string,
                public inputs: string[],
                public outputs: string[],
                public body: string
    ) {
    }

    toString(): string {
        return `${JSON.stringify(this.key)},${JSON.stringify(this.inputs)},${JSON.stringify(this.outputs)},${this.fun()}`;
    }

    fun(): string {
        if (this.outputs.length === 0) return `(${this.inputs.join(',')}) => ${this.body}`
        return `(${this.inputs.join(',')}) => {
${this.body}
return {${this.outputs.join(',')}};
}`;
    }
}

/** HTMLTransformer **/
export class HTMLTransformer {
    constructor(private rewriter: HTMLRewriter) {
        this.rewriter.on('script[reactive]', new ScriptTransformer(this))
        this.rewriter.on('body', new BodyTransformer(this))
    }

    transform(input: Response | Blob | Bun.BufferSource): Response;
    transform(input: string): string;
    transform(input: ArrayBuffer): ArrayBuffer;
    transform(input: any): any {
        return this.rewriter.transform(input)
    }

    definitions: NodeDefinition[] = [];

    addScript(javascript: string): string[] {
        const program = parseScript(javascript);
        const inputs = findUnresolvedReferences(program);
        const outputs = findTopLevelVariableDeclarations(program);
        const key = simpleHash(javascript);
        let newJavascript = processJSX(program);
        if (!javascript.endsWith(';') && newJavascript.endsWith(';')) newJavascript = newJavascript.slice(0, -1);
        this.definitions.push(new NodeDefinition(key, inputs, outputs, newJavascript))
        return [key, ...outputs];
    }
}

class ScriptTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    private chunks: string[] = [];

    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.remove();
        start.onEndTag(endTag => this.endTag(endTag));
    }

    endTag(end: HTMLRewriterTypes.EndTag) {
        const names = this.controller.addScript(this.getJavascript());
        end.after(names.map(name => `<slot name="${name}"></slot>`).join(""), {html: true})
        end.remove();
    }

    private getJavascript() {
        const javascript = this.chunks.join('');
        this.chunks.length = 0;
        return javascript;
    }

    text(chunk: HTMLRewriterTypes.Text): void | Promise<void> {
        this.chunks.push(chunk.text)
        chunk.remove();
    }
}

class BodyTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.onEndTag(endTag => this.endTag(endTag));
    }

    endTag(end: HTMLRewriterTypes.EndTag) {
        const sorted = topologicalSort(this.controller.definitions);
        end.before(`<script type="importmap"> { "imports": { "@bodar/": "/" } }</script>
<script type="module">
import {Renderer} from "@bodar/dataflow/Renderer.ts";
import {${JSX2DOM.name}} from "@bodar/jsx2dom/JSX2DOM.ts";
const jsx = new JSX2DOM();
const renderer = new Renderer();
${sorted.map((d: NodeDefinition) => `renderer.register(${d});`).join('\n')}
renderer.render();
</script>`, {html: true})
    }
}