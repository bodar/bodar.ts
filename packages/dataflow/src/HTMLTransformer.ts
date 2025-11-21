/** @module
 * Module
 * **/
import {simpleHash} from "./simpleHash.ts";
import {findTopLevelVariableDeclarations, findUnresolvedReferences, parseScript} from "./function-parsing.ts";
import {topologicalSort} from "./TopologicalSort.ts";


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
        this.definitions.push(new NodeDefinition(key, inputs, outputs, javascript))
        return [key, ...outputs];
    }
}

export class ScriptTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
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

export class BodyTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
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
const renderer = new Renderer();
${sorted.map((d: NodeDefinition) => `renderer.render(${d});`).join('\n')}
</script>`, {html: true})
    }
}