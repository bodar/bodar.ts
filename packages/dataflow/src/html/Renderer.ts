/** @module
 * Renderer module
 * **/
import {BaseGraph} from "../BaseGraph.ts";
import type {Node as GraphNode} from "../Node.ts";
import {Display} from "../api/display.ts";

export interface RendererDependencies {
    graph: BaseGraph,
    document: Document,
    Node: typeof Node,
    DocumentFragment: typeof DocumentFragment,
}

/** Renderer **/
export class Renderer {
    constructor(private deps: RendererDependencies) {
    }

    register(key: string, inputs: string[], outputs: string[], fun: Function): void {
        this.deps.graph.define(key, inputs, outputs, fun);
    }

    render(): void {
        const {document, DocumentFragment} = this.deps;
        const display = Array.from(document.querySelectorAll<HTMLSlotElement>(`slot[name]`))
            .map(slot => this.deps.graph.get(slot.name))
            .filter(n => n) as GraphNode<any>[];
        const nodes = new Set<GraphNode<any>>([...display, ...this.deps.graph.sinks()]);
        nodes.forEach(async node => {
            const slot = document.querySelector<HTMLSlotElement>(`slot[name="${node.key}"]`);
            for await (const {value: update} of node) {
                if (slot) {
                    const displays = Display.for(node.key).pop();
                    const updates = [...(Array.isArray(update) ? update : [update]), ...displays];
                    const newNode = this.createUpdateNode(updates);
                    if (!newNode) continue;
                    if (newNode instanceof DocumentFragment) {
                        while (slot.childNodes.length > newNode.childNodes.length) slot.removeChild(slot.lastChild!);
                        // copy the children as when we move them from the fragment the index will change
                        const newNodeChildren = Array.from(newNode.childNodes);
                        const slotChildren = Array.from(slot.childNodes);
                        for (let i = 0; i < newNodeChildren.length; i++) {
                            const newChild = newNodeChildren[i];
                            const slotChild = slotChildren[i];
                            if (slotChild === undefined) slot?.appendChild(newChild);
                            else if (!newChild.isEqualNode(slotChild)) slotChild.replaceWith(newChild);
                        }
                    } else if (slot.childNodes.length === 1) {
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