import {HTMLTransformer} from "./HTMLTransformer.ts";

export class ScriptTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    private chunks: string[] = [];

    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        const attributes = new Map(start.attributes);
        start.remove();
        start.onEndTag(endTag => this.endTag(endTag, attributes));
    }

    endTag(end: HTMLRewriterTypes.EndTag, attributes: Map<string, string>) {
        const javascript = this.getJavascript();
        const definition = this.controller.addScript(javascript, attributes);
        if (definition.hasDisplay() || definition.hasWidth()) end.after(`<slot name="${definition.key}"></slot>`, {html: true});
        if (attributes.has('data-echo')) this.echoScript(end, attributes, javascript)
        end.remove();
    }

    private getJavascript() {
        const javascript = this.chunks.join('');
        this.chunks.length = 0;
        return trimIndent(javascript);
    }

    text(chunk: HTMLRewriterTypes.Text): void | Promise<void> {
        this.chunks.push(chunk.text)
        chunk.remove();
    }

    private echoScript(end: HTMLRewriterTypes.EndTag, attributes: Map<string, string>, javascript: string): void {
        const echo = attributes.get('data-echo') || 'javascript';
        end.after('</code></pre>', {html: true});
        if (echo === 'html') end.after('\n</script>');
        end.after(javascript);
        if (echo === 'html') end.after(`<script${(this.formatAttributes(attributes))}>` + '\n');
        end.after(`<pre><code class="language-${echo}">`, {html: true});
    }

    private formatAttributes(attributes: Map<string, string>) {
        attributes.delete('data-echo');
        return Array.from(attributes.entries(), ([key, value]) => {
            return ` ${key}${value ? `="${value}"` : ''}`;
        }).join('');
    }
}

export function trimIndent(text: string): string {
    const lines = text.split('\n');
    const firstNonEmptyIndex = lines.findIndex(line => line.trim().length > 0);
    if (firstNonEmptyIndex === -1) return '';

    const firstNonEmptyLine = lines[firstNonEmptyIndex];
    const match = firstNonEmptyLine.match(/^(\s*)/);
    const indent = match ? match[1] : '';
    const indentLength = indent.length;

    const relevantLines = lines.slice(firstNonEmptyIndex);

    if (indentLength === 0) return relevantLines.map(line => line.trimEnd()).join('\n').trimEnd();

    return relevantLines
        .map(line => (line.startsWith(indent) ? line.slice(indentLength) : line.trimStart()).trimEnd())
        .join('\n')
        .trimEnd();
}
