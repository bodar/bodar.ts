import type {ImportMap} from "./HTMLTransformer.ts";

export class HeadTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private importMap: ImportMap) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.prepend(`<script type="importmap">${JSON.stringify(this.importMap)}</script>`, {html: true})
    }
}