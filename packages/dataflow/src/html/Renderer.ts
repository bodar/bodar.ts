/** @module
 * Renderer module
 * **/
import {BaseGraph} from "../BaseGraph.ts";

export interface RendererDependencies {
    graph: BaseGraph,
    document: Document,
    Node: typeof Node,
    DocumentFragment: typeof DocumentFragment,
}

const DefaultDependencies: RendererDependencies = {
    graph: new BaseGraph(),
    document: globalThis.document,
    Node: globalThis.Node,
    DocumentFragment: globalThis.DocumentFragment
};

/** Renderer **/
export class Renderer {
    constructor(private deps: RendererDependencies = DefaultDependencies) {
    }

    register(key: string, inputs: string[], outputs: string[], fun: Function): void {
        this.deps.graph.define(key, inputs, outputs, fun);
    }

    render(): void {
        const {document, DocumentFragment} = this.deps;
        this.deps.graph.sinks().forEach(async (node) => {
            const slot = document.querySelector(`slot[name="${node.key}"]`);
            for await (const {value: update} of node) {
                if (slot) {
                    const newNode = this.createUpdateNode(update);
                    if (!newNode) continue;
                    if (newNode instanceof DocumentFragment && slot.childNodes.length === newNode.childNodes.length) {
                        for (let i = 0; i < slot.childNodes.length; i++) {
                            const slotChild = slot.childNodes[i];
                            const newChild = newNode.childNodes[i];
                            if (!slotChild.isEqualNode(newChild)) slotChild.replaceWith(newChild);
                        }
                    } else if (slot.childNodes.length === 1 && !(newNode instanceof DocumentFragment)) {
                        if (!slot.childNodes[0].isEqualNode(newNode)) slot.replaceChildren(newNode);
                    } else {
                        slot.replaceChildren(newNode);
                    }

                }
            }
        });
    }

    private createUpdateNode(update: any): Node | undefined {
        const {document, Node} = this.deps;
        if (Array.isArray(update)) {
            const fragment = document.createDocumentFragment();
            fragment.replaceChildren(...update.map(u => this.createUpdateNode(u)).filter(u => u !== undefined));
            return fragment;
        } else if (typeof update === "string") {
            return document.createTextNode(update);
        } else if (typeof update === "number") {
            return document.createTextNode(String(update));
        }
        if (update instanceof Node) {
            return update;
        }
    }
}