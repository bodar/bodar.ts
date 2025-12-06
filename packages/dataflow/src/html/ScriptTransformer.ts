import {HTMLTransformer} from "./HTMLTransformer.ts";
import {display} from "../api/display.ts";

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
        const names = this.controller.addScript(javascript, attributes.get('id'));
        end.after(names.filter(name => name.startsWith(display.prefix)).map(name => `<slot name="${name}"></slot>`).join(""), {html: true});
        if (attributes.has('data-echo')) this.echoScript(end, attributes, javascript)
        end.remove();
    }

    private getJavascript() {
        const javascript = this.chunks.join('');
        this.chunks.length = 0;
        return javascript.trim();
    }

    text(chunk: HTMLRewriterTypes.Text): void | Promise<void> {
        this.chunks.push(chunk.text)
        chunk.remove();
    }

    private echoScript(end: HTMLRewriterTypes.EndTag, attributes: Map<string, string>, javascript: string): void {
        const echo = attributes.get('data-echo') || 'javascript';
        end.after('</code></pre>', {html: true});
        if(echo === 'html') end.after('\n</script>');
        end.after(javascript);
        if(echo === 'html') end.after(`<script${(this.formatAttributes(attributes))}>` + '\n');
        end.after(`<pre><code class="language-${echo}">`, {html: true});
    }

    private formatAttributes(attributes: Map<string, string>) {
        attributes.delete('data-echo');
        return Array.from(attributes.entries(), ([key, value]) => {
            return ` ${key}${value ? `="${value}"` : ''}`;
        }).join('');
    }

}