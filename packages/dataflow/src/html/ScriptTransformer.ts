import {HTMLTransformer} from "./HTMLTransformer.ts";

export class ScriptTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    private chunks: string[] = [];

    constructor(private controller: HTMLTransformer) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        const id: string | undefined = start.getAttribute('id') || undefined;
        start.remove();
        start.onEndTag(endTag => this.endTag(endTag, id));
    }

    endTag(end: HTMLRewriterTypes.EndTag, id?: string) {
        const names = this.controller.addScript(this.getJavascript(), id);
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