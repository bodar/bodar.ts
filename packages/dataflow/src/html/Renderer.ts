/** @module
 * Renderer module
 * **/
import {BaseGraph} from "../BaseGraph.ts";

export interface RendererDependencies {
    graph: BaseGraph,
}

/** Renderer **/
export class Renderer {
    constructor(private deps: RendererDependencies) {
    }

    register(key: string, inputs: string[], outputs: string[], fun: Function): void {
        this.deps.graph.define(key, inputs, outputs, fun);
    }

    render(): void {
        this.deps.graph.sinks().forEach(async node => {
            for await (const {value} of node) {
                // Display is now handled directly by NodeDefinition
                void (value);
            }
        });
    }
}

