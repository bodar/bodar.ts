/** @module
 * Renderer module
 * **/
import {Graph} from "./Graph.ts";

/** Renderer **/
export class Renderer {
    constructor(private graph: Graph = new Graph(), private doc: Document = document) {
    }

    async render(key: string, inputs: string[], outputs: string[], fun: Function) {
        const nodes = this.graph.define(key, inputs, outputs, fun);
        Object.entries(nodes).map(async ([id, node]) => {
            const slot = this.doc.querySelector(`slot[name="${id}"]`)!;
            for await (const update of node) {
                const newNode = this.createUpdateNode(update);
                if (!newNode) continue;
                slot.replaceChildren(newNode);
            }
        });
    }

    private createUpdateNode(update: any): Node | undefined {
        if (typeof update === "string") {
            return this.doc.createTextNode(update);
        } else if (typeof update === "number") {
            return this.doc.createTextNode(String(update));
        }
        if (update instanceof Node) {
            return update;
        }
    }
}