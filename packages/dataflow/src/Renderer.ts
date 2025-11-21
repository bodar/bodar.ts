/** @module
 * Renderer module
 * **/
import {Graph} from "./Graph.ts";

/** Renderer **/
export class Renderer {
    constructor(private graph: Graph = new Graph(), private doc: Document = document) {
    }

    async register(key: string, inputs: string[], outputs: string[], fun: Function) {
        this.graph.define(key, inputs, outputs, fun);
    }

    render() {
        this.graph.sinks().map(async (node) => {
            const slot = this.doc.querySelector(`slot[name="${node.key}"]`)!;
            for await (const update of node) {
                const newNode = this.createUpdateNode(update);
                if (!newNode) continue;
                if(newNode instanceof HTMLDivElement) console.log('div', newNode.style.color);
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