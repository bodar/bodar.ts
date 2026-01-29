import type {ImportMap} from "./TransformationController.ts";

export class StartTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private importMap: ImportMap) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        start.prepend(`<script type="importmap">${JSON.stringify(this.importMap)}</script>`, {html: true})
    }
}