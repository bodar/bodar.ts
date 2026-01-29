import {TransformationController} from "./TransformationController.ts";

export class EndTransformer implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
    constructor(private controller: TransformationController) {
    }

    element(start: HTMLRewriterTypes.Element): void | Promise<void> {
        this.controller.pushScope();
        start.onEndTag(endTag => this.endTag(endTag));
    }

    async endTag(end: HTMLRewriterTypes.EndTag) {
        const result = await this.controller.generateRuntimeScript();
        if (result) {
            end.before(`<script type="module" is="reactive-runtime" id="${result.scriptId}">${result.javascript}</script>`, {html: true});
        }
    }
}

// Re-export scriptTemplate for backwards compatibility
export {scriptTemplate} from "./TransformationController.ts";
