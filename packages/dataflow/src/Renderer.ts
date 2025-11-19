/** @module
 * Renderer module
 * **/
import {Graph} from "./Graph.ts";

/** Renderer **/
export class Renderer {
    constructor(private graph: Graph = new Graph()) {
    }

    async render(key: string, inputs: string[], outputs: string[], fun: Function) {
        const node = this.graph.define(key, inputs, outputs, fun);
        // const comment = this.findPlaceholder(key);
        for await (const update of node[key]) {
            console.log(update);
        }
    }

    // findPlaceholder(key: string): Comment {
    //     this.document.
    // }
}