import {simpleHash} from "./simpleHash.ts";
import {findTopLevelVariableDeclarations, parseScript} from "./function-parsing.ts";

export class NodeDefinition {
    constructor(public key: string,
                public inputs: string[],
                public outputs: string[],
                public body: string
    ) {
    }

    *[Symbol.iterator]() {
        yield JSON.stringify(this.key);
        yield JSON.stringify(this.inputs);
        yield JSON.stringify(this.outputs);
        yield `(${this.inputs.join(',')}) => {
${this.body}
return {${this.outputs.join(',')}};
}`;
    }


}

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

    addScript(javascript: string): string {
        const program = parseScript(javascript);
        const outputs = findTopLevelVariableDeclarations(program);
        const key = simpleHash(javascript);
        this.definitions.push(new NodeDefinition(key, [], outputs, javascript))
        return key;
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
        const id = this.controller.addScript(this.getJavascript());
        end.after(`<!--?placeholder id="${id}"?-->`, {html: true})
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
        end.before(`<script type="module">
import {Graph} from "@bodar/dataflow/Graph.ts";
const graph = new Graph();
${this.controller.definitions.map((d: NodeDefinition) => `graph.define(${[...d]});`)}
</script>`, {html: true})
    }
}