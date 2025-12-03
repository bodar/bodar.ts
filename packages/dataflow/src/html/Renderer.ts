/** @module
 * Renderer module
 * **/
import {BaseGraph} from "../BaseGraph.ts";

/** Renderer **/
export class Renderer {
    constructor(private graph: BaseGraph = new BaseGraph(), private doc: Document = document) {
    }

    async register(key: string, inputs: string[], outputs: string[], fun: Function) {
        this.graph.define(key, inputs, outputs, fun);
    }

    render() {
        this.graph.sinks().forEach(async (node) => {
            const slot = this.doc.querySelector(`slot[name="${node.key}"]`);
            for await (const {value: update} of node) {
                if (slot) {
                    const newNode = this.createUpdateNode(update);
                    if (!newNode) continue;
                    // if (newNode instanceof DocumentFragment) {
                    //     if (slot.childNodes.length === newNode.childNodes.length) {
                    //         for (let i = 0; i < slot.childNodes.length; i++) {
                    //             const slotChild = slot.childNodes[i];
                    //             const newChild = newNode.childNodes[i];
                    //             if (!slotChild.isEqualNode(newChild)) slotChild.replaceWith(newNode);
                    //         }
                    //         continue;
                    //     }
                    // }
                    // if (slot.childNodes.length !== 1 || !slot.childNodes[0].isEqualNode(newNode)) slot.replaceChildren(newNode);
                    slot.replaceChildren(newNode);
                }
            }
        });
    }

    private createUpdateNode(update: any): Node | undefined {
        if (Array.isArray(update)) {
            const fragment = this.doc.createDocumentFragment();
            fragment.replaceChildren(...update.map(u => this.createUpdateNode(u)).filter(u => u !== undefined));
            return fragment;
        } else if (typeof update === "string") {
            return this.doc.createTextNode(update);
        } else if (typeof update === "number") {
            return this.doc.createTextNode(String(update));
        }
        if (update instanceof Node) {
            return update;
        }
    }
}