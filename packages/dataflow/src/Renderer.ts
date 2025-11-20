/** @module
 * Renderer module
 * **/
import {Graph} from "./Graph.ts";
import {placeholder} from "./Placeholder.ts";

/** Renderer **/
export class Renderer {
    constructor(private graph: Graph = new Graph(), private doc: Document = document) {
    }

    async render(key: string, inputs: string[], outputs: string[], fun: Function) {
        const nodes = this.graph.define(key, inputs, outputs, fun);
        const start = this.findPlaceholder(key);
        for (const [id, node] of Object.entries(nodes)) {
            let target = start.nextSibling;
            for await (const update of node) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const newNode = this.createUpdateNode(update);
                if (!newNode) continue;
                if (!target || (target as any)[id] !== id) {
                    (newNode as any)[id] = id;
                    target = target?.parentNode?.insertBefore(newNode, target) as ChildNode;
                } else {
                    target.parentNode?.replaceChild(newNode, target);
                }
            }
        }
    }

    private createUpdateNode(update: any): Node | undefined {
        if (typeof update === "string") {
            return this.doc.createTextNode(update);
        } else if (typeof update === "number") {
            return this.doc.createTextNode(String(update));
        } if (update instanceof Node) {
            return update;
        }
    }

    findPlaceholder(key: string): Comment {
        const walker = this.doc.createTreeWalker(this.doc.documentElement, NodeFilter.SHOW_COMMENT, {
            acceptNode: (node) =>
                node.nodeValue?.trim() === placeholder(key) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });

        const comment = walker.nextNode();
        if (!comment) throw new Error(`No placeholder comment found for key: ${key}`);
        return comment as Comment;
    }


}